import { Asignatura } from '../../ArchivosComunes/Asignatura.js';
import { EstadoAcademico } from '../interfaces/EstadoAcademico.js';
import { IProyeccionStrategy } from './IProyeccionStrategy.js';

export class GreedyProjectionStrategy implements IProyeccionStrategy 
{
    
    private malla: Map<number, Asignatura[]>;
    // Usamos el grafo que ya viene calculado en el EstadoAcademico
    private grafoPrerrequisitos: Map<string, Asignatura[]>;
    private asignaturasAprobadas: Set<string>;
    private periodoActual: string;

    // Ya no pasamos todo suelto, pasamos el objeto de contexto
    constructor(estado: EstadoAcademico) 
    {
        this.asignaturasAprobadas = new Set(estado.asignaturasAprobadas);
        this.grafoPrerrequisitos = estado.grafoPrerrequisitos; // Usamos el grafo del facade
        this.periodoActual = estado.ultimoPeriodo;
        this.malla = this.eliminarAsignaturasAprobadasDeMalla(estado.mallaPorNiveles);
    }

    public generar(estado?: EstadoAcademico): Map<string, Asignatura[]> 
    {
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
                // Si no podemos inscribir nada pero queda malla, hay un bloqueo (ciclo o error de datos)
                console.warn("Bloqueo detectado o fin de asignaturas disponibles.");
                break;
            }

            // Simular aprobación
            asignaturasDelSemestre.forEach(a => this.asignaturasAprobadas.add(a.codigo));
            this.malla = this.eliminarAsignaturasAprobadasDeMalla(this.malla);
        }

        return proyeccionOptima;
    }

    private planificarSiguienteSemestre(): Asignatura[] 
{
        let creditosInscritos = 0;
        const semestrePlanificado: Asignatura[] = [];
        
        const semestresPendientes = Array.from(this.malla.keys()).sort((a, b) => a - b);
        if (semestresPendientes.length === 0) return [];

        const semestreMasAtrasado = semestresPendientes[0];
        // Tu lógica de mirar 2 semestres adelante
        const limiteSemestre = semestreMasAtrasado + 2; 

        let asignaturasElegibles: Asignatura[] = [];
        for (const [nivel, asignaturas] of this.malla.entries()) 
        {
            if (nivel <= limiteSemestre) 
            {
                const disponibles = asignaturas.filter(a => this.verificarPrerrequisitos(a));
                asignaturasElegibles.push(...disponibles);
            }
        }

        const priorizadas = this.ordenarPorPrioridad(asignaturasElegibles);

        for (const asignatura of priorizadas) 
        {
            if (creditosInscritos + asignatura.creditos <= 31) 
            { // Límite hardcodeado (podría ser configurable)
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
            if (a.nivel !== b.nivel) return a.nivel - b.nivel;
            // Usamos el tamaño del array de dependencias como "peso"
            const pesoA = this.grafoPrerrequisitos.get(a.codigo)?.length || 0;
            const pesoB = this.grafoPrerrequisitos.get(b.codigo)?.length || 0;
            return pesoB - pesoA;
        });
    }

    private verificarPrerrequisitos(asignatura: Asignatura): boolean 
    {
        if (!asignatura.prereq) return true;
        // Check simple contra el Set de aprobadas
        return asignatura.prereq.split(',').every(p => this.asignaturasAprobadas.has(p));
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