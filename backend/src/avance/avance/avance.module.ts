import { Module } from '@nestjs/common';
import { AvanceController } from './avance.controller.js';
import { AvanceService } from './avance.service.js';

@Module({
  controllers: [AvanceController],
  providers: [AvanceService]
})
export class AvanceModule {}
