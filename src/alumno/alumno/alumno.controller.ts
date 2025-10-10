import { Controller, Get, Post } from '@nestjs/common';
import { AlumnoService } from './alumno.service';

@Controller({})
export class AlumnoController 
{
    constructor(private alumno: AlumnoService) {}

    @Post('/login')
    getData()
    {
        return this.alumno.getAlumno("pedro@example.com", "qwerty");
    }
}
