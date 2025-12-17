import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';
import { AuthGuard } from '@nestjs/passport';

describe('EstadisticasController', () => {
  let controller: EstadisticasController;
  let service: EstadisticasService;

  const mockService = {
    obtenerRankingReprobacion: jest.fn().mockResolvedValue([]),
    obtenerMasDemandadas: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstadisticasController],
      providers: [
        { provide: EstadisticasService, useValue: mockService }
      ],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<EstadisticasController>(EstadisticasController);
    service = module.get<EstadisticasService>(EstadisticasService);
  });

  it('debe llamar al servicio de reprobación con parámetros correctos', async () => {
    await controller.obtenerRankingReprobacion('8606', '202310', '5');
    expect(service.obtenerRankingReprobacion).toHaveBeenCalledWith('8606', 5, '202310');
  });

  it('debe usar valor por defecto para top', async () => {
    await controller.obtenerRankingReprobacion('8606');
    expect(service.obtenerRankingReprobacion).toHaveBeenCalledWith('8606', 10, undefined);
  });

  it('debe llamar al servicio de demanda', async () => {
    await controller.obtenerMasDemandadas('8606', '202410', '5');
    expect(service.obtenerMasDemandadas).toHaveBeenCalledWith('8606', '202410', 5);
  });
});