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
    
    // 1. Crea una "lista VIP" (un Set) con todos los códigos de asignatura que SÍ existen.
    // Las búsquedas en un Set son extremadamente rápidas.
        const codigosValidos = new Set(malla.map(asignatura => asignatura.codigo));

        // 2. Usa .map() para recorrer cada asignatura y devolver una versión "limpia".
        return malla.map((asignatura) => {
            
            // Si la asignatura no tiene prerrequisitos, devuélvela tal cual.
            if (!asignatura.prereq) 
            {
                return asignatura;
            }
            
            // 3. Procesa los prerrequisitos de la asignatura actual.
            const prerequisitosLimpios = asignatura.prereq
            .split(',') // a. Divide el string en un array de códigos.
            .filter(codigo => codigosValidos.has(codigo)); // b. Quédate solo con los que están en la "lista VIP".

            // 4. Crea un nuevo objeto de asignatura con los prerrequisitos actualizados.
            return {
            ...asignatura, // Copia todas las propiedades originales de la asignatura.
            prereq: prerequisitosLimpios.join(','), // Une los códigos válidos de vuelta en un string.
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

    async getMalla(codigoCarrera: string, catalogo: string)
    {
        const malla = await this.fetchMallaCarrera(codigoCarrera, catalogo);

        let mallaSeparada = this.mallaSeparadaEnSemestres(malla);
    
        return Object.fromEntries(mallaSeparada);
    }
}
