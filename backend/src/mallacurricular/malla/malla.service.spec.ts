import { Test, TestingModule } from '@nestjs/testing';
import { MallaService } from './malla.service';
import { AcademicUtilsService } from '../../ArchivosComunes/AcademicUtilsService';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Asignaturas } from '../entities/asignatura.entity';

// Mock global de fetch
global.fetch = jest.fn();

describe('MallaService', () => {
  let service: MallaService;
  let repo: any;
  let utils: AcademicUtilsService;

  const mockRepo = {
    create: jest.fn(d => d),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockUtils = {
    limpiarPrerrequisitosInvalidos: jest.fn(d => d),
    construirGrafoDeApertura: jest.fn().mockReturnValue(new Map()),
    agruparPor: jest.fn().mockReturnValue(new Map()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MallaService,
        { provide: AcademicUtilsService, useValue: mockUtils },
        { provide: getRepositoryToken(Asignaturas), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MallaService>(MallaService);
    repo = module.get(getRepositoryToken(Asignaturas));
    utils = module.get<AcademicUtilsService>(AcademicUtilsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchMallaCarrera', () => {
    it('debe retornar datos si la API responde OK', async () => {
      const mockData = [{ codigo: 'A' }];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const res = await service.fetchMallaCarrera('8606', '2020');
      expect(res).toEqual(mockData);
      expect(utils.limpiarPrerrequisitosInvalidos).toHaveBeenCalled();
    });

    it('debe lanzar error si la API falla', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
      });
      await expect(service.fetchMallaCarrera('8606', '2020')).rejects.toThrow();
    });

    it('debe lanzar error si la data esta vacia', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => [],
        });
        await expect(service.fetchMallaCarrera('8606', '2020')).rejects.toThrow('Malla no encontrada');
    });
  });

  describe('sincronizarMalla', () => {
    it('debe guardar datos en repositorio', async () => {
      jest.spyOn(service, 'fetchMallaCarrera').mockResolvedValue([{ codigo: 'A' } as any]);
      
      await service.sincronizarMalla('8606', '2020');
      
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('obtenerMallaDesdeBD', () => {
      it('debe retornar malla agrupada', async () => {
          repo.find.mockResolvedValue([{ codigoAsignatura: 'A', prerrequisitos: 'B,C' }]);
          
          await service.obtenerMallaDesdeBD('8606');
          
          expect(utils.construirGrafoDeApertura).toHaveBeenCalled();
          expect(utils.agruparPor).toHaveBeenCalled();
      });
  });
});