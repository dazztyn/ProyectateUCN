import { BadRequestException, Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AvanceService } from './avance.service';
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
        
        const index = parseInt(indiceCarrera, 10);
                
        if (isNaN(index) || !usuario.carreras || !usuario.carreras[index]) 
        {
            throw new BadRequestException(`El índice de carrera ${index} no es válido.`);
        }
        
        const carrera = usuario.carreras[index];
        return this.avance.getAvance(usuario.rut, carrera.codigo, carrera.catalogo);
    }
}
