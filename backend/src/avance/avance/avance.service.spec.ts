import { Test, TestingModule } from '@nestjs/testing';
import { AvanceService } from './avance.service';
import { MallaService } from '../../mallacurricular/malla/malla.service';
import { AcademicUtilsService } from '../../ArchivosComunes/AcademicUtilsService';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvanceReal } from './entities/avance-real.entity';
import { RamoTomado } from './RamoTomado';
import { AvanceConAsignatura } from './AvanceConAsignatura';

describe('AvanceService', () => {
  let service: AvanceService;
  let repo: any;

  // Mocks
  const mockRepo = {
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockResolvedValue(true),
  };

  const mockMallaService = {
    fetchMallaCarrera: jest.fn().mockResolvedValue([
        { codigo: 'MAT101', asignatura: 'Calculo I', creditos: 6 }
    ])
  };

  const mockUtils = {
    buscarAsignatura: jest.fn().mockReturnValue({ codigo: 'MAT101', asignatura: 'Calculo I', creditos: 6 }),
    agruparPor: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvanceService,
        { provide: MallaService, useValue: mockMallaService },
        { provide: AcademicUtilsService, useValue: mockUtils },
        { provide: getRepositoryToken(AvanceReal), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AvanceService>(AvanceService);
    repo = module.get(getRepositoryToken(AvanceReal));
  });

  describe('sincronizarAvanceFull', () => {
    it('debe insertar un registro nuevo si no existe en BD', async () => {
      
      const mockApiData: RamoTomado[] = [{
        nrc: '123', period: '202310', student: '111', course: 'MAT101',
        excluded: false, inscriptionType: 'N', status: 'APROBADO'
      }];
      
      jest.spyOn(service, 'fetchAvanceData').mockResolvedValue(mockApiData);

      jest.spyOn(service, 'rellenarListaDeAvance').mockReturnValue([
          new AvanceConAsignatura('123', '202310', '111', { codigo: 'MAT101', asignatura: 'Calculo I', creditos: 6 } as any, false, 'N', 'APROBADO')
      ]);

      repo.find.mockResolvedValue([]);

      await service.sincronizarAvanceFull('111', '8606', '2020');

      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(expect.arrayContaining([
          expect.objectContaining({ codigoAsignatura: 'MAT101', estado: 'APROBADO' })
      ]));
    });

    it('debe actualizar un registro existente si cambian los datos', async () => {

        jest.spyOn(service, 'fetchAvanceData').mockResolvedValue([]); 
        jest.spyOn(service, 'rellenarListaDeAvance').mockReturnValue([
            new AvanceConAsignatura('999', '202310', '111', { codigo: 'MAT101', creditos: 6 } as any, false, 'N', 'APROBADO')
        ]);

        const datoAntiguo = { 
            codigoAsignatura: 'MAT101', periodo: '202310', nrc: '111', estado: 'INSCRITO', creditos: 6 
        };
        repo.find.mockResolvedValue([datoAntiguo]);

        await service.sincronizarAvanceFull('111', '8606', '2020');

        expect(datoAntiguo.nrc).toBe('999'); 
        expect(datoAntiguo.estado).toBe('APROBADO'); 
        expect(repo.save).toHaveBeenCalled();
    });
  });
});