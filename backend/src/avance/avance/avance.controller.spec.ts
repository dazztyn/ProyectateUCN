import { Test, TestingModule } from '@nestjs/testing';
import { AvanceController } from './avance.controller';
import { AvanceService } from './avance.service';
import { AuthGuard } from '@nestjs/passport';
import { BadRequestException } from '@nestjs/common';

describe('AvanceController', () => {
  let controller: AvanceController;
  let service: AvanceService;

  const mockAvanceService = {
    obtenerAvanceDesdeBD: jest.fn(),
  };

  const mockUser = {
    rut: '111',
    carreras: [{ codigo: '8606' }]
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvanceController],
      providers: [
        { provide: AvanceService, useValue: mockAvanceService }
      ],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<AvanceController>(AvanceController);
    service = module.get<AvanceService>(AvanceService);
  });

  it('debe retornar avance si indice valido', async () => {
    mockAvanceService.obtenerAvanceDesdeBD.mockResolvedValue({});
    const req = { user: mockUser };
    await controller.getAvance(req as any, '0');
    expect(service.obtenerAvanceDesdeBD).toHaveBeenCalledWith('111', '8606');
  });

  it('debe lanzar BadRequestException si indice invalido', async () => {
    const req = { user: mockUser };
    expect(() => controller.getAvance(req as any, '99')).toThrow(BadRequestException);
  });
});