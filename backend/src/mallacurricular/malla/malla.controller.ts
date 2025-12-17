import { BadRequestException, Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { MallaService } from './malla.service.js';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Usuario } from '../../ArchivosComunes/Usuario.js';

@Controller('malla')
@UseGuards(AuthGuard('jwt'))
export class MallaController 
{
    constructor(private malla: MallaService){}

    @Get(':indiceCarrera')
    getMalla
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

        return this.malla.obtenerMallaDesdeBD(carrera.codigo);
    }

}