import { Module } from '@nestjs/common';
import { ProyeccionController } from './proyeccion.controller.js';
import { ProyeccionService } from './proyeccion.service.js';
import { AvanceModule } from '../avance/avance//avance.module.js';
import { MallaModule } from '../mallacurricular/malla/malla.module.js';

@Module({
  imports: [
    MallaModule, 
    AvanceModule
  ],
  controllers: [ProyeccionController],
  providers: [ProyeccionService]
})
export class ProyeccionModule {}
