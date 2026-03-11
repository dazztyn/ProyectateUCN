import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadisticasService } from './estadisticas.service';
import { EstadisticasController } from './estadisticas.controller';
import { InstanciaAsignatura } from '../proyeccion/entities/InstanciaAsignatura.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstanciaAsignatura])
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
  exports: [EstadisticasService] 
})
export class EstadisticasModule {}