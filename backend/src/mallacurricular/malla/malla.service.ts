import { Injectable } from '@nestjs/common';
import { Asignatura } from 'src/ArchivosComunes/Asignatura.js';


@Injectable()
export class MallaService 
{
    async fetchMallaCarrera(codigoCarrera: string, catalogo: string): Promise<Asignatura[]>
    {
        const url = `https://losvilos.ucn.cl/hawaii/api/mallas?${codigoCarrera}-${catalogo}`;

        try 
        {
            const response = await fetch(url, {headers: {'X-HAWAII-AUTH': 'jf400fejof13f'},});

            if (!response.ok) 
            {
                throw new Error(`Error de red o servidor: ${response.status} ${response.statusText}`);
            }

            const data: Asignatura[] = await response.json();

            if (data.length == 0) 
            {
                throw new Error('Malla no encontrada o Catalogo/Codigo de carrera incorrecto');
            }

            return this.limpiarPrerrequisitosInvalidos(data);
        } 
        catch (error) 
        {
            console.error(`[fetchMallaCarrera] Falló la petición: ${error.message}`);
            throw error;
        }
    }

    asignaturasCantidadAparicionesPrerrequisitos(malla: Asignatura[])
    {
        const hasmap = new Map<string, number>();

        malla.forEach((asignatura) => 
        {
            const codigo = asignatura.codigo;

            if(!hasmap.has(codigo))
            {
                hasmap.set(codigo, 0);
            }
        });

        malla.forEach((asignatura) => 
        {
            const prereq = asignatura.prereq;
            let codigos: string[] = [];
            if(prereq != '')
            {
                codigos = prereq.split(",");
                codigos.forEach((codigo) => 
                {
                    if(hasmap.has(codigo))
                    {
                        let codigoActual = hasmap.get(codigo) as number;
                        codigoActual += 1;
                        hasmap.set(codigo, codigoActual);
                    }
                });
            }
        });
        return hasmap;
    }

    limpiarPrerrequisitosInvalidos(malla: Asignatura[]): Asignatura[] {

        const codigosValidos = new Set(malla.map(asignatura => asignatura.codigo));

        return malla.map((asignatura) => {

            if (!asignatura.prereq) 
            {
                return asignatura;
            }

            const prerequisitosLimpios = asignatura.prereq
            .split(',') 
            .filter(codigo => codigosValidos.has(codigo));
            return {
            ...asignatura, 
            prereq: prerequisitosLimpios.join(','), 
            };
        });
    }

    buscarAsignaturaEnMalla(codigo: string, malla: Asignatura[]): Asignatura | undefined
    {
        return malla.find((asignatura) => asignatura.codigo === codigo);
    }

    mallaSeparadaEnSemestres(malla: Asignatura[])
    {
        let hashmap = new Map<number, Asignatura[]>();

        malla.forEach((asignatura) => 
        {
            let nivel = asignatura.nivel;
            if(!hashmap.has(nivel))
            {
                hashmap.set(nivel, []);
            }
            hashmap.get(nivel)?.push(asignatura);
        });

        return hashmap;
    }

    hashMapALista(malla: Map<number, Asignatura[]>)
    {

    }

    agregarListaDeAsignaturasQueAbre()
    {

    }

    async getMalla(codigoCarrera: string, catalogo: string)
    {
        const malla = await this.fetchMallaCarrera(codigoCarrera, catalogo);

        let mallaSeparada = this.mallaSeparadaEnSemestres(malla);
    
        return Object.fromEntries(mallaSeparada);
    }
}
