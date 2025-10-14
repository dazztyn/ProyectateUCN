import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { MallaService } from './malla.service.js';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Usuario } from 'src/ArchivosComunes/Usuario.js';

@Controller('malla')
@UseGuards(AuthGuard('jwt'))
export class MallaController 
{
    constructor(private malla: MallaService){}

    @Get(':indiceCarrera')
    getMalla
    (
        @Req() request: Request,
        @Param('indiceCarrera') indice: string,
    )
    {
        const usuario = request.user as Usuario;
        return this.malla.getMalla(usuario.carreras[indice].codigo, usuario.carreras[indice].catalogo);
    }
}
