import { Module } from '@nestjs/common';
import { MallaService } from './malla.service.js';
import { MallaController } from './malla.controller.js';
import { AcademicUtilsService } from 'src/ArchivosComunes/AcademicUtilsService';

@Module({
  providers: [MallaService,
    AcademicUtilsService
  ],
  controllers: [MallaController],
  exports: [MallaService],
})
export class MallaModule {}
