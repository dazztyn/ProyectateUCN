import { Test, TestingModule } from '@nestjs/testing';
import { MallaService } from './malla.service';

describe('MallaService', () => {
  let service: MallaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MallaService],
    }).compile();

    service = module.get<MallaService>(MallaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
