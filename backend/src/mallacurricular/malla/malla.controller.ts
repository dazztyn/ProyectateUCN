import { Controller, Get, Param } from '@nestjs/common';
import { MallaService } from './malla.service.js';

@Controller('malla')
export class MallaController 
{
    constructor(private malla: MallaService){}

    @Get(':codigoCarrera/:catalogo')
    getMalla
    (
        @Param('codigoCarrera') codigoCarrera: string,
        @Param('catalogo') catalogo: string,
    )
    {
        return this.malla.getMalla(codigoCarrera, catalogo);
    }
}
