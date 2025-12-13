import { Test, TestingModule } from '@nestjs/testing';
import { StudentDataFacade } from './StudentDataFacade';
import { MallaService } from '../mallacurricular/malla/malla.service';
import { AvanceService } from '../avance/avance/avance.service';
import { AcademicUtilsService } from '../ArchivosComunes/AcademicUtilsService';

describe('StudentDataFacade', () => {
  let facade: StudentDataFacade;
  let mallaService: MallaService;
  let avanceService: AvanceService;

  // Mocks
  const mockMallaService = { fetchMallaCarrera: jest.fn().mockResolvedValue([]) };
  const mockAvanceService = { 
    fetchAvanceData: jest.fn().mockResolvedValue([]),
    rellenarListaDeAvance: jest.fn().mockReturnValue([]),
    avanceSeparadoPorPeriodo: jest.fn().mockReturnValue(new Map()),
    sacarUltimoPeriodo: jest.fn().mockReturnValue('202320')
  };
  const mockUtils = {
    agruparPor: jest.fn().mockReturnValue(new Map()),
    obtenerCodigosAprobados: jest.fn().mockReturnValue(new Set()),
    construirGrafoDeApertura: jest.fn().mockReturnValue(new Map())
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentDataFacade,
        { provide: MallaService, useValue: mockMallaService },
        { provide: AvanceService, useValue: mockAvanceService },
        { provide: AcademicUtilsService, useValue: mockUtils },
      ],
    }).compile();

    facade = module.get<StudentDataFacade>(StudentDataFacade);
    mallaService = module.get<MallaService>(MallaService);
    avanceService = module.get<AvanceService>(AvanceService);
  });

  it('debe orquestar la obtención de datos', async () => {
    const resultado = await facade.obtenerEstadoAcademico('111', '8606', '202320');

    expect(mallaService.fetchMallaCarrera).toHaveBeenCalled();
    expect(avanceService.fetchAvanceData).toHaveBeenCalled();
    expect(mockUtils.construirGrafoDeApertura).toHaveBeenCalled();
    
    // Verificar estructura de retorno
    expect(resultado).toHaveProperty('mallaCompleta');
    expect(resultado).toHaveProperty('grafoPrerrequisitos');
  });
});