import { Module } from '@nestjs/common';
import { AlumnoController } from './alumno.controller';
import { AlumnoService } from './alumno.service';

@Module({
  controllers: [AlumnoController],
  providers: [AlumnoService]
})
export class AlumnoModule {}
