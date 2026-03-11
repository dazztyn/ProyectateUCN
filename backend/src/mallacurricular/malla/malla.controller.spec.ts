import { Test, TestingModule } from '@nestjs/testing';
import { MallaController } from './malla.controller';
import { MallaService } from './malla.service';
import { AuthGuard } from '@nestjs/passport';
import { BadRequestException } from '@nestjs/common';

describe('MallaController', () => {
  let controller: MallaController;
  let service: MallaService;

  const mockMallaService = {
    obtenerMallaDesdeBD: jest.fn(),
  };

  const mockUser = {
    rut: '111',
    carreras: [{ codigo: '8606' }]
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MallaController],
      providers: [
        { provide: MallaService, useValue: mockMallaService }
      ],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<MallaController>(MallaController);
    service = module.get<MallaService>(MallaService);
  });

  it('debe retornar la malla si el indice es valido', async () => {
    mockMallaService.obtenerMallaDesdeBD.mockResolvedValue({});
    const req = { user: mockUser };
    
    await controller.getMalla(req as any, '0');
    expect(service.obtenerMallaDesdeBD).toHaveBeenCalledWith('8606');
  });

  it('debe lanzar BadRequestException si el indice es invalido', async () => {
    const req = { user: mockUser };
    expect(() => controller.getMalla(req as any, '99')).toThrow(BadRequestException);
    expect(() => controller.getMalla(req as any, 'texto')).toThrow(BadRequestException);
  });
});