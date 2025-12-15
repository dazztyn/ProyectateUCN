import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EstadisticasService } from './estadisticas.service';
import { RolesGuard } from '../auth/auth/roles.guard';

@Controller('estadisticas')
@UseGuards(AuthGuard('jwt'), RolesGuard)

export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get(':periodo')
  getEstadisticas(@Param('periodo') periodo: string) {
    return this.estadisticasService.obtenerEstadisticas(periodo);
  }
}