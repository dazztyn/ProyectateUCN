import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionService } from './proyeccion.service';
import { StudentDataFacade } from './StudentDataFacade';
import { ProyeccionMapper } from './proyeccion.mapper';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Proyeccion } from './entities/proyeccion.entity';
import { Semestre } from './entities/semestre.entity';
import { InstanciaAsignatura } from './entities/InstanciaAsignatura.entity';
import { EstadoAcademico, AvancePlano } from './interfaces/EstadoAcademico';
import { DataSource } from 'typeorm';
import { ProyeccionConsistencyService } from './proyeccion.consistencia';
import { ProyeccionStrategyFactory } from './strategies/proyeccion-strategy.factory';

describe('ProyeccionService', () => {
  
  let service: ProyeccionService;
  let facade: StudentDataFacade;
  let mockProyeccionRepo: any;
  let mockSemestreRepo: any;
  let mockInstanciaRepo: any;
  let mockQueryRunner: any;
  let mockConsistencyService: any;
  let mockStrategyFactory: any;
  let mockMapper: any;



  const mockFacade = {
    obtenerEstadoAcademico: jest.fn().mockResolvedValue({
      mallaCompleta: [],
      avancePlanoLista: [],
      avancePorPeriodo: new Map(),
      mallaPorNiveles: new Map(),
      asignaturasAprobadas: new Set(),
      ultimoPeriodo: '202320',
      grafoPrerrequisitos: new Map()
    } as EstadoAcademico)
  };

  mockMapper = {
    toPersistenceCatalog: jest.fn().mockReturnValue([]),
    avanceToPersistence: jest.fn().mockReturnValue([{ numero: 1, periodo: '202310', totalCreditos: 10, instancias: [] }]),
    futureToPersistence: jest.fn().mockReturnValue([]),
    toResponse: jest.fn(),
    toSummaryResponseList: jest.fn()
  };

  mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
 
    manager: {
      create: jest.fn().mockImplementation((entity, dto) => dto),

      save: jest.fn().mockImplementation(entity => Promise.resolve({ ...entity, id: 1, idProyeccion: 1 })),
      remove: jest.fn(),
 
      findOne: jest.fn().mockResolvedValue({ id: 1, codigo: 'MAT101', creditos: 5 }),
      

      getRepository: jest.fn().mockReturnValue({
          count: jest.fn().mockResolvedValue(1), 
          findOne: jest.fn().mockResolvedValue({ id: 1, codigo: 'MAT101' }), 
          create: jest.fn(d => d),
          save: jest.fn(d => Promise.resolve({ ...d, id: 1 })),
          find: jest.fn().mockResolvedValue([])
      }),

      createQueryBuilder: jest.fn(() => ({
          insert: jest.fn().mockReturnThis(),
          into: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          orIgnore: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue(true),
      }))
    }
  };

  const mockDataSource = {
    createQueryBuilder: jest.fn(),
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner)
  };

  mockStrategyFactory = {
    createStrategy: jest.fn().mockReturnValue({ generar: jest.fn().mockReturnValue(new Map()) })
  };

  mockConsistencyService = {
    validarYCorregir: jest.fn().mockResolvedValue(true)
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockProyeccionRepo = {
        create: jest.fn().mockImplementation(dto => dto),
        save: jest.fn().mockResolvedValue({ idProyeccion: 1 }),
        findOne: jest.fn(), 
        find: jest.fn().mockResolvedValue([])
    };

    mockSemestreRepo = {
        create: jest.fn().mockImplementation(dto => dto),
        save: jest.fn(),
        findOne: jest.fn()
    };

    mockInstanciaRepo = {
        create: jest.fn().mockImplementation(dto => dto),
        manager: {
            getRepository: jest.fn().mockReturnValue({
                count: jest.fn().mockResolvedValue(1) 
            })
        },

        createQueryBuilder: jest.fn(() => ({
            leftJoin: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            addGroupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([])
        }))
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProyeccionService,
        { provide: StudentDataFacade, useValue: mockFacade },
        { provide: ProyeccionMapper, useValue: mockMapper },
        { provide: DataSource, useValue: mockDataSource },
        
        { provide: getRepositoryToken(Proyeccion), useValue: mockProyeccionRepo },
        { provide: getRepositoryToken(Semestre), useValue: mockSemestreRepo },
        { provide: getRepositoryToken(InstanciaAsignatura), useValue: mockInstanciaRepo },

        { provide: ProyeccionStrategyFactory, useValue: mockStrategyFactory },
        { provide: ProyeccionConsistencyService, useValue: mockConsistencyService }
      ],
    }).compile();

    service = module.get<ProyeccionService>(ProyeccionService);
    facade = module.get<StudentDataFacade>(StudentDataFacade);
  });



  describe('proyeccionFutura', () => {
    it('debe orquestar la generación automática', async () => {

      mockProyeccionRepo.findOne.mockResolvedValue({ 
          idProyeccion: 1, 
          rutUsuario: '111', 
          semestres: [] 
      });
      mockMapper.toResponse.mockReturnValue({ id: 1, nombre: 'Test' });

      await service.proyeccionFutura('111', '8606', '2020', { ideal: false, nombreProyeccion: 'Test' } as any);

      expect(mockStrategyFactory.createStrategy).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });
  });

  describe('validarConsistenciaProyeccion', () => {
    it('debe delegar al servicio de consistencia', async () => {
      mockProyeccionRepo.findOne.mockResolvedValue({ idProyeccion: 1, semestres: [] });
      
      await service.validarConsistenciaProyeccion(1, '2020');
      
      expect(mockConsistencyService.validarYCorregir).toHaveBeenCalled();
    });
  });

  describe('guardarSemestreManual', () => {
    it('debe guardar un semestre editado manualmente y validar consistencia', async () => {
      const mockAsignaturasDto = [{ codigo: 'MAT101', creditos: 5, nombre: 'Calc' }];
      
      mockProyeccionRepo.findOne.mockResolvedValueOnce({ idProyeccion: 1, codigoCarrera: '8606' });

      mockSemestreRepo.findOne.mockResolvedValueOnce(null);

      mockProyeccionRepo.findOne.mockResolvedValueOnce({ idProyeccion: 1, semestres: [] });
      mockMapper.toResponse.mockReturnValue({ id: 1 });

      await service.guardarSemestreManual(1, 2, '202410', mockAsignaturasDto as any, '2020');

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockConsistencyService.validarYCorregir).toHaveBeenCalled();
    });
  });

  describe('autocompletarProyeccion', () => {
    it('debe generar semestres futuros y guardarlos', async () => {
      mockProyeccionRepo.findOne.mockResolvedValue({
          idProyeccion: 1, rutUsuario: '111', codigoCarrera: '8606',
          semestres: [{ numero: 1, periodo: '202310' }]
      });

      mockStrategyFactory.createStrategy.mockReturnValue({
          generar: () => new Map([['202320', [{ codigo: 'MAT200' }]]])
      });
      mockMapper.futureToPersistence.mockReturnValue([{ numero: 2, periodo: '202320', instancias: [] }]);
      mockMapper.toResponse.mockReturnValue({ id: 1 });

      await service.autocompletarProyeccion(1, '2020');

      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
});