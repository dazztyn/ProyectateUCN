import { Injectable } from '@nestjs/common';

@Injectable()
export class MallaService {

    private readonly HAWAII_API = 'https://losvilos.ucn.cl/hawaii/api/mallas';
    private readonly API_KEY = 'jf400fejof13f'; // clave de autenticación

    async getMalla(codigoCarrera: string, catalogo: string): Promise<any> 
    {
        const url = `${this.HAWAII_API}?${codigoCarrera}-${catalogo}`;
        const headers = {'X-HAWAII-AUTH': this.API_KEY};

        const response = await fetch(url, { headers });
        if (!response.ok) 
        {
            throw new Error(`Error obteniendo malla: ${response.statusText}`);
        }

        const data = await response.json();

        return data.map((item: any) => ({      
            codigo: item.codigo,
            nombre: item.asignatura,
            creditos: item.creditos,
            nivel: item.nivel,
            prerequisitos: item.prereq?.split(',') ?? [],
        }));
    }
}