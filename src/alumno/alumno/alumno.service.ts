import { Injectable } from '@nestjs/common';


export interface LoginResponse
{
    rut: string;
    carreras: 
    {
        codigo:string;
        nombre:string;
        catalogo:string;
    }[];
}
export interface ErrorResponse 
{
  error: string;
}

@Injectable()
export class AlumnoService 
{
   async fetchloginData(email: string, password: string): Promise<LoginResponse> 
    {
        const url = `https://puclaro.ucn.cl/eross/avance/login.php?email=${email}&password=${password}`;

        try 
        {
            const response = await fetch(url);

            if (!response.ok) 
            {
                throw new Error(`Error de red o servidor: ${response.status} ${response.statusText}`);
            }

            const data: LoginResponse | ErrorResponse = await response.json();

            if ('error' in data) 
            {
                throw new Error(data.error || 'Credenciales incorrectas.');
            }

            return data;
        } 
        catch (error) 
        {
            console.error(`[fetchLoginData] Falló la petición: ${error.message}`);
            throw error;
        }
    }

    async getAlumno(email: string, contraseña: string)
    {
        const alumno = await this.fetchloginData(email, contraseña);
        return alumno;
    }
}

