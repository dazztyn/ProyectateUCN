import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProyeccionService } from './proyeccion.service';
import type { Request } from 'express';
import { Usuario } from '../ArchivosComunes/Usuario.js';

@Controller('proyeccion')
@UseGuards(AuthGuard('jwt'))
export class ProyeccionController 
{
    constructor(private proyeccion: ProyeccionService){}
    @Get(':indiceCarrera')
    getProyeccion
    (
        @Req() request: Request,
        @Param('indiceCarrera') indiceCarrera: string
    )
    {
        const usuario = request.user as Usuario;
        return this.proyeccion.proyeccionFutura(usuario.rut, usuario.carreras[indiceCarrera].codigo, usuario.carreras[indiceCarrera].catalogo);
    }
    
}
