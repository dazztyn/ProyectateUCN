import { Test, TestingModule } from '@nestjs/testing';
import { AvanceController } from './avance.controller';
import { AvanceService } from './avance.service';

describe('AvanceController', () => {
  let controller: AvanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvanceController],
      providers: [
        {
          provide: AvanceService,
          useValue: {
            getAvance: jest.fn()
          }
        }
      ],
    }).compile();

    controller = module.get<AvanceController>(AvanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});