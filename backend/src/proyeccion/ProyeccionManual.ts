import { Asignatura } from "../ArchivosComunes/Asignatura.js";
import { EstadoAcademico } from "./interfaces/EstadoAcademico.js";

export class ProyeccionManual
{   
    private malla: Map<number, Asignatura[]>;
    private asignaturasAprobadas: Set<string>; 

    constructor(estado: EstadoAcademico) 
    {    
        this.asignaturasAprobadas = estado.asignaturasAprobadas;
        this.malla = this.eliminarAsignaturasAprobadasDeMalla(estado.mallaPorNiveles);
    }

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
        return asignatura.prereq.split(',').every(prereq => this.asignaturasAprobadas.has(prereq));
    }

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