import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionService } from './proyeccion.service';

describe('ProyeccionService', () => {
  let service: ProyeccionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProyeccionService],
    }).compile();

    service = module.get<ProyeccionService>(ProyeccionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
