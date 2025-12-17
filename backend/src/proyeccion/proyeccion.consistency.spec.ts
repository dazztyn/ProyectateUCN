import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionConsistencyService } from './proyeccion.consistencia';
import { DataSource } from 'typeorm';
import { Semestre } from './entities/semestre.entity';
import { InstanciaAsignatura } from './entities/InstanciaAsignatura.entity';
import { Asignatura } from '../ArchivosComunes/Asignatura';

describe('ProyeccionConsistencyService', () => {
  let service: ProyeccionConsistencyService;

  const mockManager = {
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: mockManager,
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProyeccionConsistencyService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ProyeccionConsistencyService>(ProyeccionConsistencyService);
    jest.clearAllMocks(); 
  });

  const mockAsignatura = (cod: string, nivel: number, reqs = ''): Asignatura => ({
    codigo: cod, 
    nivel, 
    creditos: 5, 
    asignatura: `Nombre ${cod}`, 
    asignaturasQueAbre: [],
    prerrequisitos: reqs, 
    prereq: reqs 
  }) as unknown as Asignatura;

  const mockInstancia = (id: number, asig: Asignatura): InstanciaAsignatura => ({
    id, 
    estado: 'PENDIENTE', 
    asignatura: { codigoAsignatura: asig.codigo, ...asig } as any, 
    semestre: null as any
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('Fase 1: Validación Académica', () => {
    it('debe eliminar una asignatura si excede el nivel permitido (Tapón + 2)', async () => {

      const malla = [mockAsignatura('M1', 1), mockAsignatura('M5', 5)];
      const aprobados = new Set<string>(); // Nada aprobado

      const instanciaInvalida = mockInstancia(1, mockAsignatura('M5', 5));
      const semestre = { 
        idSemestre: 1, numero: 1, periodo: '202410', editable: true, 
        instancias: [instanciaInvalida], totalCreditos: 10 
      } as Semestre;

      await service.validarYCorregir([semestre], malla, aprobados, '202320');

      expect(mockManager.remove).toHaveBeenCalledWith(instanciaInvalida);
      expect(semestre.instancias).toHaveLength(0);
    });

    it('NO debe eliminar si el semestre está protegido (recién editado)', async () => {

      const malla = [mockAsignatura('M1', 1), mockAsignatura('M5', 5)];
      const aprobados = new Set<string>();

      const instanciaForzada = mockInstancia(1, mockAsignatura('M5', 5));
      const semestre = { 
        idSemestre: 1, numero: 1, periodo: '202410', editable: true, 
        instancias: [instanciaForzada], totalCreditos: 10 
      } as Semestre;

      await service.validarYCorregir([semestre], malla, aprobados, '202320', '202410');

      expect(mockManager.remove).not.toHaveBeenCalled();
      expect(semestre.instancias).toHaveLength(1);
    });

    it('debe eliminar asignaturas con prerrequisitos faltantes', async () => {

      const malla = [mockAsignatura('M1', 1), mockAsignatura('M2', 2, 'M1')];
      const aprobados = new Set<string>();

      const instanciaM2 = mockInstancia(1, mockAsignatura('M2', 2, 'M1'));
      const semestre = { 
        idSemestre: 1, numero: 1, periodo: '202410', editable: true, 
        instancias: [instanciaM2], totalCreditos: 5 
      } as Semestre;

      await service.validarYCorregir([semestre], malla, aprobados, '202320');

      expect(mockManager.remove).toHaveBeenCalledWith(instanciaM2);
    });
  });

  describe('Fase 2: Defragmentación (Tetris)', () => {
    it('debe eliminar semestres vacíos y reordenar los siguientes', async () => {

      const sem1 = { idSemestre: 1, numero: 1, periodo: '202410', editable: true, instancias: [], totalCreditos: 0 } as unknown as Semestre;
      const sem2 = { idSemestre: 2, numero: 2, periodo: '202420', editable: true, instancias: [mockInstancia(1, mockAsignatura('M1', 1))], totalCreditos: 5 } as Semestre;

      await service.validarYCorregir([sem1, sem2], [], new Set(), '202320');

      expect(mockManager.remove).toHaveBeenCalledWith(expect.arrayContaining([sem1]));

      expect(sem2.numero).toBe(1);
      expect(sem2.periodo).toBe('202410'); 
      expect(mockManager.save).toHaveBeenCalledWith(sem2);
    });
  });
});