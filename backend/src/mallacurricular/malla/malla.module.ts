import { Module } from '@nestjs/common';
import { MallaService } from './malla.service.js';
import { MallaController } from './malla.controller.js';

@Module({
  providers: [MallaService],
  controllers: [MallaController],
  exports: [MallaService],
})
export class MallaModule {}
