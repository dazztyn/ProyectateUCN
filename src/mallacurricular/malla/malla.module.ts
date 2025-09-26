import { Module } from '@nestjs/common';
import { MallaService } from './malla.service';
import { MallaController } from './malla.controller';

@Module({
  providers: [MallaService],
  controllers: [MallaController]
})
export class MallaModule {}
