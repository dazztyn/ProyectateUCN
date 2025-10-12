import { Module } from '@nestjs/common';
import { AlumnoController } from './alumno.controller.js';
import { AlumnoService } from './alumno.service.js';

@Module({
  controllers: [AlumnoController],
  providers: [AlumnoService]
})
export class AlumnoModule {}
