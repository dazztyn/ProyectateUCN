import { Module } from '@nestjs/common';
import { ProyeccionController } from './proyeccion.controller.js';
import { ProyeccionService } from './proyeccion.service.js';
import { AvanceModule } from '../avance/avance//avance.module.js';
import { MallaModule } from '../mallacurricular/malla/malla.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyeccion } from './entities/proyeccion.entity.js';
import { Semestre } from './entities/semestre.entity.js';
import { Asignaturas } from './entities/asignatura.entity.js';

@Module({
  imports: [
    MallaModule,
    AvanceModule,
    TypeOrmModule.forFeature([Proyeccion, Semestre, Asignaturas])
  ],
  controllers: [ProyeccionController],
  providers: [ProyeccionService]
})
export class ProyeccionModule {}
