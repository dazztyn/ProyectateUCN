import { Controller, Get } from '@nestjs/common';
import { AlumnoService } from './alumno.service';

@Controller()
export class AlumnoController 
{
    constructor(private alumno: AlumnoService) {}
    @Get('/login')
    getData(email: string, contraseña: string)
    {
        return this.alumno.getAlumno(email, contraseña);
    }
}
