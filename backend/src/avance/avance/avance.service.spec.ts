import { Test, TestingModule } from '@nestjs/testing';
import { AvanceService } from './avance.service';
import { MallaService } from '../../mallacurricular/malla/malla.service';
import { AcademicUtilsService } from '../../ArchivosComunes/AcademicUtilsService';

describe('AvanceService', () => {
  let service: AvanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvanceService,
        {
          provide: MallaService,
          useValue: {
            buscarAsignaturaEnMalla: jest.fn(),
            fetchMallaCarrera: jest.fn()
          }
        },
        {
          provide: AcademicUtilsService,
          useValue: {
            agruparPor: jest.fn().mockReturnValue(new Map())
          }
        }
      ],
    }).compile();

    service = module.get<AvanceService>(AvanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});