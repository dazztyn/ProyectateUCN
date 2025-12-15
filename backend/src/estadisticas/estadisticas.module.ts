import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';
import { InstanciaAsignatura } from '../proyeccion/entities/InstanciaAsignatura.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstanciaAsignatura])
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
})
export class EstadisticasModule {}