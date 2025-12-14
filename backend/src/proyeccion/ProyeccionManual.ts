import { Asignatura } from "../ArchivosComunes/Asignatura.js";
import { EstadoAcademico } from "./interfaces/EstadoAcademico.js";

export class ProyeccionManual
{   
    private malla: Map<number, Asignatura[]>;
    // private aparicionesPrerrequisitos: Map<string, Asignatura[]>; // Ya no se usa para priorizar aquí, pero está disponible si se requiere
    private asignaturasAprobadas: Set<string>; 
    private periodoActual: string;

    // --- CAMBIO: Ahora recibe el objeto de contexto unificado ---
    constructor(estado: EstadoAcademico) 
    {    
        this.asignaturasAprobadas = estado.asignaturasAprobadas;
        this.periodoActual = estado.ultimoPeriodo; // O el periodo que definas como inicial
        
        // La malla ya viene agrupada por niveles desde el Facade, solo filtramos las aprobadas
        this.malla = this.eliminarAsignaturasAprobadasDeMalla(estado.mallaPorNiveles);
    }

    // Elimina las asignaturas ya aprobadas de la malla para armar la proyección del sgte semestre
    private eliminarAsignaturasAprobadasDeMalla(mallaMap: Map<number, Asignatura[]>): Map<number, Asignatura[]> 
    {
        const nuevaMalla = new Map<number, Asignatura[]>();
        for (const [nivel, asignaturas] of mallaMap.entries()) 
        {
            const pendientes = asignaturas.filter(a => !this.asignaturasAprobadas.has(a.codigo));
            if (pendientes.length > 0) 
            {
                nuevaMalla.set(nivel, pendientes);
            }
        }
        return nuevaMalla;
    }

    private verificarPrerrequisitosCumplidos(asignatura: Asignatura): boolean 
    {
        if (!asignatura.prereq) return true;
        // Check eficiente usando el Set de aprobadas
        return asignatura.prereq.split(',').every(prereq => this.asignaturasAprobadas.has(prereq));
    }

    // Prepara un array de asignaturas disponibles para inscribir en el semestre a proyectar
    private prepararAsignaturasDisponibles(): Asignatura[]
    {
        let asignaturasElegibles: Asignatura[] = [];

        const semestresPendientes = Array.from(this.malla.keys()).sort((a, b) => a - b);
        if (semestresPendientes.length === 0) return [];

        const semestreMasAtrasado = semestresPendientes[0];
        const limiteSemestre = semestreMasAtrasado + 2;

        for (const [nivel, asignaturas] of this.malla.entries()) {
            if (nivel <= limiteSemestre) {
                const disponiblesEnNivel = asignaturas.filter(
                    (asignatura) => this.verificarPrerrequisitosCumplidos(asignatura)
                );
                asignaturasElegibles.push(...disponiblesEnNivel);
            }
        }

        return asignaturasElegibles;
    }

    private prepararAsignaturasNoDisponibles(): Asignatura[]
    {
        const noDisponibles: Asignatura[] = [];

        const semestresPendientes = Array.from(this.malla.keys()).sort((a, b) => a - b);
        if (semestresPendientes.length === 0) return [];

        const semestreMasAtrasado = semestresPendientes[0];
        const limiteSemestre = semestreMasAtrasado + 2;

        for (const [nivel, asignaturas] of this.malla.entries())
        {
            const fueraDeRango = nivel > limiteSemestre;

            const noDisponiblesEnNivel = asignaturas.filter(asignatura =>
                fueraDeRango || !this.verificarPrerrequisitosCumplidos(asignatura)
            );

            noDisponibles.push(...noDisponiblesEnNivel);
        }

        return noDisponibles;
    }

    public enviarAsignaturas(): { disponibles: Asignatura[], noDisponibles: Asignatura[] }
    {
        const disponibles = this.prepararAsignaturasDisponibles();
        const noDisponibles = this.prepararAsignaturasNoDisponibles();

        return { disponibles, noDisponibles };
    }
}