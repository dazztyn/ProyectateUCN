import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProyeccionService } from './proyeccion.service';
import type { Request } from 'express';
import { Usuario } from '../ArchivosComunes/Usuario.js';
import { CreacionProyeccion } from './DtoProyeccion/CreacionProyeccion';
import { AsignaturaInputDto } from './DtoProyeccion/GuardarSemestreDto';

@Controller('proyeccion')
@UseGuards(AuthGuard('jwt'))
export class ProyeccionController 
{
    constructor(private proyeccion: ProyeccionService){}

    @Post('/ProyeccionManual/:indiceCarrera')
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

    @Post('/ProyeccionIdeal/:indiceCarrera')
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

    @Post('/actualizarProyeccion/:indiceCarrera/:idProyeccion/:numeroSemestre/:periodo')
    actualizarProyeccion
    (
        @Req() request: Request,
        @Param('indiceCarrera') indiceCarrera: string,
        @Param('idProyeccion') idProyeccion: string,
        @Param('numeroSemestre') numeroSemestre: string,
        @Param('periodo') periodo: string,
        @Body() semestre: AsignaturaInputDto[]
    )
    {
        const usuario = request.user as Usuario;

        const index = parseInt(indiceCarrera, 10);
        
        if (isNaN(index) || !usuario.carreras || !usuario.carreras[index]) 
        {
            throw new BadRequestException(`El índice de carrera ${index} no es válido.`);
        }
        const carrera = usuario.carreras[index];

        return this.proyeccion.guardarSemestreManual(
            parseInt(idProyeccion, 10), 
            parseInt(numeroSemestre, 10), 
            periodo, 
            semestre,
            carrera.catalogo
        );

    }

    @Patch('/autocompletar/:indiceCarrera')
    autocompletarProyeccion
    (
        @Req() request: Request,
        @Param('indiceCarrera') indiceCarrera: string,
        @Query('idProyeccion') idProyeccion: string
    )
    {
        const usuario = request.user as Usuario;

        const index = parseInt(indiceCarrera, 10);

        if (isNaN(index) || !usuario.carreras || !usuario.carreras[index]) 
        {
            throw new BadRequestException(`El índice de carrera ${index} no es válido.`);
        }

        const carrera = usuario.carreras[index];

        return this.proyeccion.autocompletarProyeccion(parseInt(idProyeccion, 10), carrera.catalogo);
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
        @Query('idProyeccion') idProyeccion: string,
        @Query('semestreObjetivo') semestreObjetivo?: string
    )
    {
        const usuario = request.user as Usuario;

        const index = parseInt(indiceCarrera, 10);
        
        if (isNaN(index) || !usuario.carreras || !usuario.carreras[index]) 
        {
            throw new BadRequestException(`El índice de carrera ${index} no es válido.`);
        }

        const semestreNum = semestreObjetivo ? Number(semestreObjetivo) : undefined;

        const carrera = usuario.carreras[index];
        
        return this.proyeccion.obtenerAsignaturasProyeccionManual(parseInt(idProyeccion, 10), carrera.catalogo, semestreNum);
    }

    @Get('/estadisticas/:periodo')
    getEstadisticas
    (
        @Param('periodo') periodo: string
    ) 
    {
        return this.proyeccion.obtenerEstadisticas(periodo);
    }

}
