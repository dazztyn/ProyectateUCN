import { Test, TestingModule } from '@nestjs/testing';
import { MallaController } from './malla.controller';

describe('MallaController', () => {
  let controller: MallaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MallaController],
    }).compile();

    controller = module.get<MallaController>(MallaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
