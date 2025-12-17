import { Test, TestingModule } from '@nestjs/testing';
import { AvanceService } from './avance.service';
import { MallaService } from '../../mallacurricular/malla/malla.service';
import { AcademicUtilsService } from '../../ArchivosComunes/AcademicUtilsService';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvanceReal } from './entities/avance-real.entity';

global.fetch = jest.fn();

describe('AvanceService', () => {
  let service: AvanceService;
  let repo: any;
  let mallaService: any;
  let utils: any;

  const mockRepo = {
    find: jest.fn(),
    create: jest.fn(d => d),
    save: jest.fn(),
  };

  const mockMallaService = {
    fetchMallaCarrera: jest.fn(),
  };

  const mockUtils = {
    buscarAsignatura: jest.fn((cod) => ({ codigo: cod, asignatura: 'Nombre', creditos: 5 })),
    agruparPor: jest.fn().mockReturnValue(new Map()),
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
    mallaService = module.get(MallaService);
    utils = module.get(AcademicUtilsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('fetchAvanceData', () => {
    it('debe retornar data si API responde OK', async () => {
      const mockData = [{ nrc: '123' }];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });
      const res = await service.fetchAvanceData('1-9', '8606');
      expect(res).toEqual(mockData);
    });

    it('debe lanzar error si respuesta trae propiedad error', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ error: 'Fallo' }),
        });
        await expect(service.fetchAvanceData('1-9', '8606')).rejects.toThrow('Fallo');
    });
  });

  describe('sincronizarAvanceFull', () => {
    it('debe guardar registros nuevos y actualizar existentes', async () => {

      jest.spyOn(service, 'fetchAvanceData').mockResolvedValue([
        { nrc: '100', course: 'MAT1', period: '202310', status: 'APROBADO' } as any,
        { nrc: '200', course: 'MAT2', period: '202310', status: 'APROBADO' } as any 
      ]);
      mockMallaService.fetchMallaCarrera.mockResolvedValue([{ codigo: 'MAT1' }, { codigo: 'MAT2' }]);

      mockRepo.find.mockResolvedValue([
          { codigoAsignatura: 'MAT2', periodo: '202310', estado: 'REPROBADO', nrc: '200' }
      ]);

      await service.sincronizarAvanceFull('1-9', '8606', '2020');

      expect(repo.save).toHaveBeenCalled();
      const savedData = repo.save.mock.calls[0][0];
      expect(savedData.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('obtenerAvanceDesdeBD', () => {
      it('debe retornar objeto agrupado', async () => {
          mockRepo.find.mockResolvedValue([
              { nrc: '1', periodo: '202310', codigoAsignatura: 'A', nombreAsignatura: 'A', creditos: 5, estado: 'APROBADO' }
          ]);
          
          await service.obtenerAvanceDesdeBD('1-9', '8606');
          expect(utils.agruparPor).toHaveBeenCalled();
      });
  });
});