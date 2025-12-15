import { Module } from '@nestjs/common';
import { AvanceController } from './avance.controller.js';
import { AvanceService } from './avance.service.js';
import { MallaModule } from '../../mallacurricular/malla/malla.module.js';
import { AcademicUtilsService } from 'src/ArchivosComunes/AcademicUtilsService';
import { AvanceReal } from './entities/avance-real.entity';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [MallaModule,
    TypeOrmModule.forFeature([AvanceReal]),
  ],
  controllers: [AvanceController],
  providers: [AvanceService, AcademicUtilsService],
  exports: [AvanceService]
})
export class AvanceModule {}
