import { Asignatura } from "src/ArchivosComunes/Asignatura.js";


export class ProyeccionFutura
{
    private malla: Map<number, Asignatura[]>;
    private aparicionesPrerrequisitos: Map<string, number>;
    private asignaturasAprobadas: string[];
    private periodo: string;
    private creditosTotales: number;
    private semestreMasBajo: number;

    constructor(malla: Map<number, Asignatura[]>, aparicionesPrerrequisitos: Map<string, number>, 
        asignaturasAprobadas: string[], periodo: string)
    {
        this.malla = malla;
        this.aparicionesPrerrequisitos = aparicionesPrerrequisitos;
        this.asignaturasAprobadas = asignaturasAprobadas;
        this.periodo = periodo;
        this.creditosTotales = 0;
        this.semestreMasBajo = 0;
    }

    eliminarAsignaturasAprobadasDeMalla(mallaMap: Map<number, Asignatura[]>,codigosAprobados: string[]): Map<number, Asignatura[]> 
    {
        const aprobadosSet = new Set(codigosAprobados);

        for (const [nivel, asignaturasDelSemestre] of mallaMap.entries()) 
        {
            const asignaturasPendientes = asignaturasDelSemestre.filter((asignatura) => !aprobadosSet.has(asignatura.codigo));

            if (asignaturasPendientes.length === 0) 
            {
                mallaMap.delete(nivel);
            } 
            else 
            {
                mallaMap.set(nivel, asignaturasPendientes);
            }
        }

        return mallaMap;
    }

    actualizarSemestreMasBajo(semestre: number)
    {
        this.semestreMasBajo = semestre;
    }

    actualizarCreditosTotales(creditos: number)
    {
        this.creditosTotales += creditos;
    }

    actualizarRamosAprobados(asignaturas: string[])
    {
        this.asignaturasAprobadas.push(...asignaturas);
    }

    actualizarMalla()
    {
        this.malla = this.eliminarAsignaturasAprobadasDeMalla(this.malla, this.asignaturasAprobadas);
    }

    actualizarPeriodo()
    {
        let semestre: string = this.periodo.slice(-2);
        let anho: string = this.periodo.slice(0, 4);
        if(semestre === '10')
        {
            this.periodo = this.periodo.slice(0, -2) + '20';
        }
        else if(semestre === '15')
        {
            this.periodo = this.periodo.slice(0, -2) + '20';
        }
        else
        {
            let nuevoAnho:string = (parseInt(anho) + 1).toString();
            this.periodo = nuevoAnho + semestre;
        }
    }

    calcularCantidadDeCreditos(asignaturas: Asignatura[]): number
    {
        return asignaturas.reduce((total, asignatura) => total + asignatura.creditos, 0);
    }

    verificarPrerrequisitosCumplidos(asignatura: Asignatura): boolean
    {
        const prerrequisitosConcatenado = asignatura.prereq;
        let prerrequisitos: string[] = prerrequisitosConcatenado.split(',');
        return prerrequisitos.every((prerrequisito) => this.asignaturasAprobadas.includes(prerrequisito));
    }

    rellenarConLoMasCritico(proyeccionOptima: Map<string, Asignatura[]>)
    {
        this.actualizarPeriodo();
        proyeccionOptima.set(this.periodo, []);
        let asignaturasCriticas: Asignatura[] = this.malla.values().next().value;
        let semestreMasBajo = this.malla.keys().next().value;
        let creditosTotales = this.calcularCantidadDeCreditos(asignaturasCriticas);
        if(creditosTotales <= 31)
        {
            proyeccionOptima.set(this.periodo, asignaturasCriticas);
            this.actualizarRamosAprobados(asignaturasCriticas.map((asignatura) => asignatura.codigo));
            this.actualizarCreditosTotales(creditosTotales);
            this.actualizarSemestreMasBajo(semestreMasBajo);
        }
        // else
        // {
        //     let creditos = 0;
        //     for(let asignatura of asignaturasCriticas)
        //     {
        //         creditos += asignatura.creditos;
        //         if(creditos <= 31)
        //         {
        //             proyeccionOptima.get(this.periodo)?.push(asignatura);
        //             this.actualizarRamosAprobados([asignatura.codigo]);
        //             this.actualizarCreditosTotales(asignatura.creditos);
        //         }
        //     }
        // }
    }

    rellenarPeriodo(proyeccionOptima: Map<string, Asignatura[]>)
    {
        
    }

    proyeccionMasOptima(proyeccionOptima: Map<string, Asignatura[]>)
    {
        this.actualizarMalla(); 
        this.rellenarConLoMasCritico(proyeccionOptima);
        if(this.creditosTotales < 30)
        {
            this.actualizarMalla();
            this.rellenarPeriodo(proyeccionOptima);
        }
    }

}