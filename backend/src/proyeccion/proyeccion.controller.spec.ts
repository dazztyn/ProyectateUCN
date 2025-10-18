import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionController } from './proyeccion.controller';

describe('ProyeccionController', () => {
  let controller: ProyeccionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProyeccionController],
    }).compile();

    controller = module.get<ProyeccionController>(ProyeccionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
