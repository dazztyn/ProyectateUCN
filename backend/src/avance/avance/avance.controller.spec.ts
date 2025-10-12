import { Test, TestingModule } from '@nestjs/testing';
import { AvanceController } from './avance.controller';

describe('AvanceController', () => {
  let controller: AvanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvanceController],
    }).compile();

    controller = module.get<AvanceController>(AvanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
