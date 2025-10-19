import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AvanceService } from './avance.service.js';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Usuario } from '../../ArchivosComunes/Usuario.js';

@Controller('avance')
@UseGuards(AuthGuard('jwt'))
export class AvanceController 
{
    constructor(private avance: AvanceService){}
    @Get(':indiceCarrera')
    getAvance
    (
        @Req() request: Request,
        @Param('indiceCarrera') indiceCarrera: string
    )
    {
        const usuario = request.user as Usuario;
        return this.avance.getAvance(usuario.rut, usuario.carreras[indiceCarrera].codigo, usuario.carreras[indiceCarrera].catalogo);
    }
}
