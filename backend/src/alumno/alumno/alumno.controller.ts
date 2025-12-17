import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AlumnoService } from './alumno.service.js';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Usuario } from '../../ArchivosComunes/Usuario.js';

@Controller('alumno')
@UseGuards(AuthGuard('jwt'))
export class AlumnoController 
{
    @Post()
    getAlumno(@Req() request: Request)
    {
        const usuario = request.user as Usuario;
        return usuario;
    }
}
