import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
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

    @Patch('/actualizarProyeccion/:indiceCarrera/:idProyeccion/:numeroSemestre/:periodo')
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

    @Get('obtenerProyeccion/:idProyeccion')
    obtenerProyeccionCompleta
    (
        @Param('idProyeccion') idProyeccion: string
    )
    {
        return this.proyeccion.obtenerProyeccionCompleta(parseInt(idProyeccion, 10));
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

    @Get('/asignaturasExcepcion/:indiceCarrera')
    obtenerAsignaturasExcepcion
    (
        @Req() request: Request,
        @Param('indiceCarrera') indiceCarrera: string,
        @Query('idProyeccion') idProyeccion: string,
        @Query('tipo') tipo: 'SIN_PREREQ' | 'EXTRA_SEMESTRE' | 'COMBINADA',
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

        if (!tipo || tipo === 'NINGUNA' as any) {
             throw new BadRequestException("Debe especificar un tipo de solicitud válido.");
        }

        return this.proyeccion.obtenerAsignaturasExcepcion(
            parseInt(idProyeccion, 10), 
            carrera.catalogo, 
            tipo, 
            semestreNum
        );
    }

    @Delete('/eliminarProyeccion/:idProyeccion')
    eliminarProyeccion
    (
        @Req() request: Request,
        @Param('idProyeccion') idProyeccion: string
    )
    {
        const usuario = request.user as Usuario;
        return this.proyeccion.eliminarProyeccion(parseInt(idProyeccion, 10), usuario.rut);
    }
}
