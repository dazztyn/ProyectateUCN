import { Module } from '@nestjs/common';
import { MallaService } from './malla.service.js';
import { MallaController } from './malla.controller.js';
import { AcademicUtilsService } from 'src/ArchivosComunes/AcademicUtilsService';
import { Asignaturas } from '../entities/asignatura.entity';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [TypeOrmModule.forFeature([Asignaturas])],
  providers: [MallaService,
    AcademicUtilsService
  ],
  controllers: [MallaController],
  exports: [MallaService],
})
export class MallaModule {}
