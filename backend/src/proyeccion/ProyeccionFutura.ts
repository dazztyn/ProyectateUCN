import { Asignatura } from "../ArchivosComunes/Asignatura.js";

export class ProyeccionFutura 
{
    private malla: Map<number, Asignatura[]>;
    private aparicionesPrerrequisitos: Map<string, Asignatura[]>;
    private asignaturasAprobadas: Set<string>; 
    private periodoActual: string;

    constructor(malla: Map<number, Asignatura[]>, aparicionesPrerrequisitos: Map<string, Asignatura[]>,
        asignaturasAprobadas: string[], periodoInicial: string) 
    {
        
        this.asignaturasAprobadas = new Set(asignaturasAprobadas);
        this.aparicionesPrerrequisitos = aparicionesPrerrequisitos;
        this.periodoActual = periodoInicial;
        this.malla = this.eliminarAsignaturasAprobadasDeMalla(malla);
    }

    public generarProyeccionOptima(): Map<string, Asignatura[]> {
        const proyeccionOptima = new Map<string, Asignatura[]>();

        while (this.malla.size > 0) 
        {
            this.actualizarPeriodo();
            const asignaturasDelSemestre = this.planificarSiguienteSemestre();

            if (asignaturasDelSemestre.length > 0) 
            {
                proyeccionOptima.set(this.periodoActual, asignaturasDelSemestre);
            } 
            else 
            {
                console.error("No se pudieron planificar más asignaturas. Posible bloqueo de prerrequisitos.");
                break;
            }

            const codigosRecienAprobados = asignaturasDelSemestre.map(a => a.codigo);
            codigosRecienAprobados.forEach(codigo => this.asignaturasAprobadas.add(codigo));
            
            this.malla = this.eliminarAsignaturasAprobadasDeMalla(this.malla);
        }

        return proyeccionOptima;
    }

    private planificarSiguienteSemestre(): Asignatura[] 
{
        let creditosInscritos = 0;
        const semestrePlanificado: Asignatura[] = [];
        
        const semestresPendientes = Array.from(this.malla.keys());
        if (semestresPendientes.length === 0) return [];

        const semestreMasAtrasado = semestresPendientes[0];
        const limiteSemestre = semestreMasAtrasado + 2;

        let asignaturasElegibles: Asignatura[] = [];
        for (const [nivel, asignaturas] of this.malla.entries())
        {
            if (nivel <= limiteSemestre) 
            {
                const disponiblesEnNivel = asignaturas.filter(asignatura => 
                    this.verificarPrerrequisitosCumplidos(asignatura)
                );
                asignaturasElegibles.push(...disponiblesEnNivel);
            }
        }
        

        const asignaturasPriorizadas = this.ordenarPorPrioridad(asignaturasElegibles);

        for (const asignatura of asignaturasPriorizadas) 
        {
            if (creditosInscritos + asignatura.creditos <= 31)
            {
                semestrePlanificado.push(asignatura);
                creditosInscritos += asignatura.creditos;
            }
        }
        
        return semestrePlanificado;
    }

    private ordenarPorPrioridad(asignaturas: Asignatura[]): Asignatura[] 
    {
        return asignaturas.sort((a, b) => 
        {
            if (a.nivel !== b.nivel) 
            {
                return a.nivel - b.nivel;
            }

            const importanciaA = this.aparicionesPrerrequisitos.get(a.codigo)?.length || 0;
            const importanciaB = this.aparicionesPrerrequisitos.get(b.codigo)?.length || 0;
            return importanciaB - importanciaA;
        });
    }

    private verificarPrerrequisitosCumplidos(asignatura: Asignatura): boolean 
    {
        if (!asignatura.prereq) return true;
        return asignatura.prereq.split(',').every(prereq => this.asignaturasAprobadas.has(prereq));
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

    private actualizarPeriodo() 
    {
        const anho = parseInt(this.periodoActual.slice(0, 4));
        const semestre = this.periodoActual.slice(4, 6);

        if (semestre === '10' || semestre === '15') 
        {
            this.periodoActual = `${anho}20`;
        } 
        else if (semestre === '20' || semestre === '25') 
        { 
            this.periodoActual = `${anho + 1}10`;
        }
    }
}