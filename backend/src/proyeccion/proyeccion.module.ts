import { Module } from '@nestjs/common';
import { ProyeccionController } from './proyeccion.controller';
import { ProyeccionService } from './proyeccion.service';

@Module({
  controllers: [ProyeccionController],
  providers: [ProyeccionService]
})
export class ProyeccionModule {}
