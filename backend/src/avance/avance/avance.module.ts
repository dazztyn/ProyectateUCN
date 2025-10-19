import { Module } from '@nestjs/common';
import { AvanceController } from './avance.controller.js';
import { AvanceService } from './avance.service.js';
import { MallaModule } from '../../mallacurricular/malla/malla.module.js';


@Module({
  imports: [MallaModule],
  controllers: [AvanceController],
  providers: [AvanceService],
  exports: [AvanceService]
})
export class AvanceModule {}
