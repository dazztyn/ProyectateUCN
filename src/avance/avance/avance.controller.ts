import { Controller, Get, Param } from '@nestjs/common';
import { AvanceService } from './avance.service';

@Controller('avance')
export class AvanceController 
{
    constructor(private avance: AvanceService){}
    @Get(':rutAlumno/:codigoCarrera')
    getAvance
    (
        @Param('rutAlumno') rutAlumno:string,
        @Param('codigoCarrera') codigoCarrera:string,
    )
    {
        return this.avance.getAvance(rutAlumno,codigoCarrera);
    }
}
