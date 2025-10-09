import { Controller, Get, Query } from '@nestjs/common';
import { MallaService } from './malla.service';

@Controller('malla')
export class MallaController {
  constructor(private readonly mallaService: MallaService) {}

  @Get()
  async obtenerMalla(
    @Query('codigoCarrera') codigoCarrera: string,
    @Query('catalogo') catalogo: string,
  ) {
    return this.mallaService.getMalla(codigoCarrera, catalogo);
  }
}
