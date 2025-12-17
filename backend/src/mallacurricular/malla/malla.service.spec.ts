import { Test, TestingModule } from '@nestjs/testing';
import { MallaService } from './malla.service';
import { AcademicUtilsService } from '../../ArchivosComunes/AcademicUtilsService';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Asignaturas } from '../entities/asignatura.entity';

describe('MallaService', () => {
  let service: MallaService;
  let repo: any;
  let utils: AcademicUtilsService;

  const mockRepo = {
    create: jest.fn(dto => dto),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUtils = {
    limpiarPrerrequisitosInvalidos: jest.fn(data => data),
    construirGrafoDeApertura: jest.fn().mockReturnValue(new Map()),
    agruparPor: jest.fn().mockReturnValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MallaService,
        { provide: getRepositoryToken(Asignaturas), useValue: mockRepo },
        { provide: AcademicUtilsService, useValue: mockUtils },
      ],
    }).compile();

    service = module.get<MallaService>(MallaService);
    repo = module.get(getRepositoryToken(Asignaturas));
    utils = module.get<AcademicUtilsService>(AcademicUtilsService);
  });

  describe('sincronizarMalla', () => {
    it('debe descargar datos de API y guardar en BD', async () => {
      // Mock de fetch global
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ codigo: 'FIS101', asignatura: 'Fisica', creditos: 6 }],
      });

      await service.sincronizarMalla('8606', '2020');

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ 
          codigoAsignatura: 'FIS101' 
      }));
      expect(repo.save).toHaveBeenCalled();
    });

    it('debe lanzar error si la API falla', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
      await expect(service.sincronizarMalla('8606', '2020')).rejects.toThrow();
    });
  });
});