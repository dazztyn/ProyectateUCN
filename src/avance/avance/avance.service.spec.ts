import { Test, TestingModule } from '@nestjs/testing';
import { AvanceService } from './avance.service';

describe('AvanceService', () => {
  let service: AvanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AvanceService],
    }).compile();

    service = module.get<AvanceService>(AvanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
