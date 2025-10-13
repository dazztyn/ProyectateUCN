import { Controller, Get, Post } from '@nestjs/common';
import { AlumnoService } from './alumno.service.js';

@Controller({})
export class AlumnoController 
{
    constructor(private readonly alumnoService: AlumnoService) 
    {
        console.log("AlumnoController initialized");
    }
}
