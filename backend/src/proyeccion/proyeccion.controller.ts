import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
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

    @Post('/Proyeccion/:indiceCarrera')
    patchCrearProyeccion
    (
        @Req() request: Request,
        @Param('indiceCarrera') indiceCarrera: string,
        @Body() proyeccion: CreacionProyeccion
    )
    {
        const usuario = request.user as Usuario;
        
        const index = parseInt(indiceCarrera, 10);
        
        if (isNaN(index) || !usuario.carreras || !usuario.carreras[index]) 
        {
            throw new BadRequestException(`El índice de carrera ${index} no es válido.`);
        }

        const carrera = usuario.carreras[index];

        return this.proyeccion.crearProyeccionConAvance(usuario.rut, carrera.catalogo, carrera.codigo, proyeccion);
    }
    
    @Post(':indiceCarrera')
    getProyeccionFutura
    (
        @Req() request: Request,
        @Param('indiceCarrera') indiceCarrera: string,
        @Body() proyeccion: CreacionProyeccion
    )
    {
        const usuario = request.user as Usuario;

        const index = parseInt(indiceCarrera, 10);
        
        if (isNaN(index) || !usuario.carreras || !usuario.carreras[index]) 
        {
            throw new BadRequestException(`El índice de carrera ${index} no es válido.`);
        }

        const carrera = usuario.carreras[index];

        return this.proyeccion.proyeccionFutura(usuario.rut, carrera.codigo, carrera.catalogo, proyeccion);
    }

    @Get('/obtenerProyecciones/:indiceCarrera')
    obtenerProyecciones
    (
        @Req() request: Request,
        @Param('indiceCarrera') indiceCarrera: string,
    )
    {
        const usuario = request.user as Usuario;

        const index = parseInt(indiceCarrera, 10);

        if (isNaN(index) || !usuario.carreras || !usuario.carreras[index]) 
        {
            throw new BadRequestException(`El índice de carrera ${index} no es válido.`);
        }

        const carrera = usuario.carreras[index];

        return this.proyeccion.listarProyeccionesDeUsuario(usuario.rut, carrera.codigo);
    }

    @Get('/asignaturasDisponibles/:indiceCarrera')
    obtenerAsignaturasDisponibles
    (
        @Req() request: Request,
        @Param('indiceCarrera') indiceCarrera: string,
    )
    {
        const usuario = request.user as Usuario;

        const index = parseInt(indiceCarrera, 10);
        
        if (isNaN(index) || !usuario.carreras || !usuario.carreras[index]) 
        {
            throw new BadRequestException(`El índice de carrera ${index} no es válido.`);
        }

        const carrera = usuario.carreras[index];
        return this.proyeccion.obtenerAsignaturasProyeccionManual(usuario.rut, carrera.codigo, carrera.catalogo);
    }

}
