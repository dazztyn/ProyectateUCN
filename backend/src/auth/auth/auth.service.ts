import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../../ArchivosComunes/Usuario.js';
import { ErrorResponse } from '../../ArchivosComunes/ErrorResponse.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolUsuario } from './entities/rol-usuario.entity.js';
import { AvanceService } from '../../avance/avance/avance.service.js';

@Injectable()
export class AuthService 
{
    constructor(
        private readonly jwtService: JwtService,
        @InjectRepository(RolUsuario)
        private readonly rolUsuarioRepository: Repository<RolUsuario>,
        private readonly avanceService: AvanceService,
    ) {}

    async fetchloginData(email: string, password: string): Promise<Usuario> 
    {
        const url = `https://puclaro.ucn.cl/eross/avance/login.php?email=${email}&password=${password}`;

        try 
        {
            const response = await fetch(url);

            if (!response.ok) 
            {
                throw new Error(`Error de red o servidor: ${response.status} ${response.statusText}`);
            }

            const data: Usuario | ErrorResponse = await response.json();

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

async login(email: string, password: string)
    {
        let usuarioLocal: RolUsuario | null = null;

        try
        {
            usuarioLocal = await this.rolUsuarioRepository.findOne({ where: { email } });
        }
        catch (error)
        {
            console.warn('Error accediendo a BD local, procediendo como estudiante normal:', error);
        }

        if(usuarioLocal)
        {
            if(usuarioLocal.password === password)
            {
                const payload = { 
                    rut: usuarioLocal.rut || 'ADMIN', 
                    carreras: [], 
                    role: usuarioLocal.rol // 'admin'
                };
                const accessToken = this.jwtService.sign(payload);
                return {
                    access_token: accessToken, 
                    role: usuarioLocal.rol, 
                    usuario: { rut: 'ADMIN', nombre: 'Administrador', carreras: [] }
                };
            }
            else
            {
                throw new UnauthorizedException('Credenciales de administrador incorrectas.');
            }
            
        }

        try
        {
            const alumno = await this.fetchloginData(email, password);

            if (alumno.carreras && alumno.carreras.length > 0) 
            {
                await Promise.all(alumno.carreras.map(async (carrera) => 
                {
                    try 
                    {
                        console.log(`Sincronizando carrera ${carrera.codigo}...`);
                        await this.avanceService.sincronizarAvanceFull(
                            alumno.rut, 
                            carrera.codigo, 
                            carrera.catalogo
                        );
                    } 
                    catch (syncError) 
                    {
                        console.error(`Error sincronizando carrera ${carrera.codigo}:`, syncError);
                    }
                }));
            }

            const payload = {
                rut: alumno.rut, 
                carreras: alumno.carreras,
                role: 'student' // Rol por defecto
            };

            const accessToken = this.jwtService.sign(payload);

            return {
                access_token: accessToken, 
                role: 'student',
                usuario: alumno
            };


        }
        catch (error)
        {
           if (error instanceof UnauthorizedException) throw error;
            throw new Error(error.message || 'Error al conectar con servicio UCN');
        }
    
    }
}
