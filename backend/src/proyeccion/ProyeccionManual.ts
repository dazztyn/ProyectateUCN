import { Asignatura } from "../ArchivosComunes/Asignatura.js";
import { EstadoAcademico } from "./interfaces/EstadoAcademico.js";

export type TipoSolicitud = 'NINGUNA' | 'SIN_PREREQ' | 'EXTRA_SEMESTRE' | 'COMBINADA';

export class ProyeccionManual
{   
    private malla: Map<number, Asignatura[]>;
    private asignaturasAprobadas: Set<string>; 

    private nivelMasAtrasado: number = 0;
    private limiteNormal: number = 0;

    constructor(estado: EstadoAcademico) 
    {    
        this.asignaturasAprobadas = estado.asignaturasAprobadas;
        this.malla = this.eliminarAsignaturasAprobadasDeMalla(estado.mallaPorNiveles);
        this.calcularLimitesBase();
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

    private calcularLimitesBase(): void
    {
        const semestresPendientes = Array.from(this.malla.keys()).sort((a, b) => a - b);
        
        if (semestresPendientes.length === 0) 
        {
            this.nivelMasAtrasado = 0;
            this.limiteNormal = 99;
        } 
        else
        {
            this.nivelMasAtrasado = semestresPendientes[0];
            this.limiteNormal = this.nivelMasAtrasado + 2; 
        }
    }

    private verificarPrerrequisitosCumplidos(asignatura: Asignatura): boolean 
    {
        if (!asignatura.prereq) return true;
        return asignatura.prereq.split(',').every(prereq => this.asignaturasAprobadas.has(prereq.trim()));
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

    public obtenerCandidatosExcepcion(tipo: TipoSolicitud): Asignatura[]
    {
        const candidatos: Asignatura[] = [];
        const limiteExtra = this.limiteNormal + 1; // El "+3" (Tapon + 2 + 1)

        for (const [nivel, asignaturas] of this.malla.entries()) 
        {
            // Filtramos asignaturas del nivel actual
            const asignaturasDelNivel = asignaturas.filter(a => {
                const prereqsOk = this.verificarPrerrequisitosCumplidos(a);
                const dentroLimiteNormal = nivel <= this.limiteNormal;
                const esNivelExtra = nivel === limiteExtra;

                switch (tipo) {
                    case 'SIN_PREREQ':
                        // Solo rango normal que falla en prerrequisitos
                        return dentroLimiteNormal && !prereqsOk;

                    case 'EXTRA_SEMESTRE':
                        // Solo nivel extra que SÍ cumple prerrequisitos
                        return esNivelExtra && prereqsOk;

                    case 'COMBINADA':
                        // AQUÍ ESTÁ EL CAMBIO QUE PEDISTE:
                        
                        // 1. Rango normal sin prerrequisitos (Carta de "Saltar Correlativo")
                        if (dentroLimiteNormal && !prereqsOk) return true;

                        // 2. Nivel Extra (Carta de "Semestre Adicional")
                        // Al ser combinada, asumimos que en el nivel extra también
                        // se aplica el "sin prerrequisitos", así que entran TODOS los de ese nivel.
                        if (esNivelExtra) return true;

                        return false;

                    default:
                        return false;
                }
            });

            candidatos.push(...asignaturasDelNivel);
        }

        return candidatos;
    }

    public enviarCandidatosExcepcion(tipo: TipoSolicitud): Asignatura[]
    {
        // Si no piden nada, devolvemos lista vacía
        if (tipo === 'NINGUNA') return [];

        const candidatos: Asignatura[] = [];
        const limiteExtra = this.limiteNormal + 1; // El nivel "+3"

        for (const [nivel, asignaturas] of this.malla.entries()) 
        {
            const asignaturasDelNivel = asignaturas.filter(a => {
                const prereqsOk = this.verificarPrerrequisitosCumplidos(a);
                const dentroLimiteNormal = nivel <= this.limiteNormal;
                const esNivelExtra = nivel === limiteExtra;

                switch (tipo) {
                    case 'SIN_PREREQ':
                        // Rango normal PERO fallan los prerrequisitos
                        return dentroLimiteNormal && !prereqsOk;

                    case 'EXTRA_SEMESTRE':
                        // Nivel extra (+3) QUE cumple prerrequisitos
                        return esNivelExtra && prereqsOk;

                    case 'COMBINADA':
                        // 1. Rango normal sin prereq
                        if (dentroLimiteNormal && !prereqsOk) return true;
                        // 2. Nivel extra (con o sin prereq)
                        if (esNivelExtra) return true;
                        
                        return false;

                    default:
                        return false;
                }
            });

            candidatos.push(...asignaturasDelNivel);
        }

        return candidatos;
    }

    public enviarAsignaturasNormales(): { disponibles: Asignatura[], noDisponibles: Asignatura[] }
    {
        const disponibles = this.prepararAsignaturasDisponibles();
        const noDisponibles = this.prepararAsignaturasNoDisponibles();

        return { disponibles, noDisponibles };
    }
}