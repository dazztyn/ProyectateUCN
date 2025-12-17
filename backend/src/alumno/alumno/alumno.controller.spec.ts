import { Test, TestingModule } from '@nestjs/testing';
import { AlumnoController } from './alumno.controller';

describe('AlumnoController', () => {
  let controller: AlumnoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlumnoController],
    }).compile();

    controller = module.get<AlumnoController>(AlumnoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
