import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProyeccionService } from './proyeccion.service';
import type { Request } from 'express';
import { Usuario } from '../ArchivosComunes/Usuario.js';
import { CreacionProyeccion } from './DtoProyeccion/CreacionProyeccion';

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
        return this.proyeccion.proyeccionFutura(usuario.rut, usuario.carreras[indiceCarrera].codigo, usuario.carreras[indiceCarrera].catalogo, "");
    }

    @Post('/Proyeccion')
    patchCrearProyeccion
    (
        @Req() request: Request,
        @Body() proyeccion: CreacionProyeccion
    )
    {
        const usuario = request.user as Usuario;
        return this.proyeccion.crearProyeccionConAvance(usuario.rut, usuario.carreras[0].catalogo, usuario.carreras[0].codigo, proyeccion);
    }














}
