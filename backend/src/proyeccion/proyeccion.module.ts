import { Module } from '@nestjs/common';
import { ProyeccionController } from './proyeccion.controller.js';
import { ProyeccionService } from './proyeccion.service.js';
import { AvanceModule } from '../avance/avance//avance.module.js';
import { MallaModule } from '../mallacurricular/malla/malla.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyeccion } from './entities/proyeccion.entity.js';
import { Semestre } from './entities/semestre.entity.js';
import { Asignaturas } from '../mallacurricular/entities/asignatura.entity.js';
import { InstanciaAsignatura } from './entities/InstanciaAsignatura.entity.js';
import { AcademicUtilsService } from '../ArchivosComunes/AcademicUtilsService.js';
import { StudentDataFacade } from './StudentDataFacade.js';
import { ProyeccionMapper } from './proyeccion.mapper.js';


@Module({
  imports: [
    MallaModule,
    AvanceModule,
    TypeOrmModule.forFeature([Proyeccion, Semestre, Asignaturas, InstanciaAsignatura])
  ],
  controllers: [ProyeccionController],
  providers: [
    ProyeccionService,
    StudentDataFacade,
    AcademicUtilsService,
    ProyeccionMapper
  ]
})
export class ProyeccionModule {}
