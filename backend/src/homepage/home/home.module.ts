import { Module } from '@nestjs/common';
import { HomeService } from './home.service.js';
import { HomeController } from './home.controller.js';

@Module({
  providers: [HomeService],
  controllers: [HomeController],
  exports: [HomeService],
})
export class HomeModule {}
