import { Controller, Get, Param, Query, UseGuards} from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('estadisticas')
@UseGuards(AuthGuard('jwt'))
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('reprobacion/:codigoCarrera')
  async obtenerRankingReprobacion
  (
    @Param('codigoCarrera') codigoCarrera: string,
    @Query('periodo') periodo?: string,
    @Query('top') top?: string
  ) 
  {
    const limite = top ? parseInt(top, 10) : 10;
    
    return this.estadisticasService.obtenerRankingReprobacion(codigoCarrera, limite, periodo);
  }

  @Get('demanda/:codigoCarrera')
  async obtenerMasDemandadas
  (
    @Param('codigoCarrera') codigoCarrera: string,
    @Query('periodo') periodo: string,
    @Query('top') top?: string
  ) 
  {
    const limite = top ? parseInt(top, 10) : 10;
    
    if (!periodo) 
    {
        return { error: 'El parámetro periodo es obligatorio (ej: ?periodo=202410)' };
    }

    return this.estadisticasService.obtenerMasDemandadas(codigoCarrera, periodo, limite);
  }
}