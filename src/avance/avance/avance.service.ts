import { Injectable } from '@nestjs/common';

export interface RamoTomado
{
    nrc: string,
    period: string,
    student: string,
    course: string,
    excluded: boolean,
    inscriptionType: string,
    status: string
}
export interface ErrorResponse 
{
  error: string;
}

@Injectable()
export class AvanceService 
{
    async fetchAvanceData(rut:string, codigoCarrera:string): Promise<RamoTomado[]>
    {
        const url = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${rut}&codcarrera=${codigoCarrera}`;
        try 
        {
            const response = await fetch(url);
            
            if (!response.ok) 
            {
                throw new Error(`Error de red o servidor: ${response.status} ${response.statusText}`);
            }

            const data: RamoTomado[] | ErrorResponse = await response.json();

            if ('error' in data) 
            {
                throw new Error(data.error || 'Datos de avance no encontrados o Rut/Codigo de carrera incorrecto.');
            }

            return data;
        } 
        catch (error) 
        {
            console.error(`[fetchAvanceData] Falló la petición: ${error.message}`);
            throw error;
        }
    }
    getAvance(rutAlumno:string, codigoCarrera:string)
    {
        return this.fetchAvanceData(rutAlumno,codigoCarrera);
    }
}
