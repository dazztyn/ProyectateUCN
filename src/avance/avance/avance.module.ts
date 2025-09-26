import { Module } from '@nestjs/common';
import { AvanceController } from './avance.controller';
import { AvanceService } from './avance.service';

@Module({
  controllers: [AvanceController],
  providers: [AvanceService]
})
export class AvanceModule {}
