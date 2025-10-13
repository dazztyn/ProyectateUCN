import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

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
export class AuthService 
{
    constructor(private readonly jwtService: JwtService) {}

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

    async login(email: string, contraseña: string)
    {
        try {

            const alumno = await this.fetchloginData(email, contraseña);

            const payload = {rut: alumno.rut, carreras: alumno.carreras};

            const accessToken = this.jwtService.sign(payload);

            return {access_token: accessToken, usuario: alumno};
            
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new Error('Ocurrió un error inesperado durante el login.');
        }
  
    }
}
