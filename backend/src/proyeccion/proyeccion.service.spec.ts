import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionService } from './proyeccion.service';
import { StudentDataFacade } from './StudentDataFacade';
import { ProyeccionMapper } from './proyeccion.mapper';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Proyeccion } from './entities/proyeccion.entity';
import { Semestre } from './entities/semestre.entity';
import { InstanciaAsignatura } from './entities/InstanciaAsignatura.entity';
import { DataSource } from 'typeorm';
import { ProyeccionConsistencyService } from './proyeccion.consistencia';
import { ProyeccionStrategyFactory } from './strategies/proyeccion-strategy.factory';

describe('ProyeccionService', () => {
  let service: ProyeccionService;
  
  let mockProyeccionRepo: any;
  let mockSemestreRepo: any;
  let mockInstanciaRepo: any;
  let mockQueryRunner: any;
  let mockStrategyFactory: any;
  let mockConsistencyService: any;
  let mockMapper: any;

  const mockFacade = {
    obtenerEstadoAcademico: jest.fn().mockResolvedValue({
      mallaCompleta: [{ 
          codigo: 'MAT101', 
          asignatura: 'Calculo I', 
          creditos: 5, 
          nivel: 1, 
          prereq: '' 
      }],
      avancePlanoLista: [],
      avancePorPeriodo: new Map(),
      mallaPorNiveles: new Map<number, any[]>(), 
      asignaturasAprobadas: new Set(),
      ultimoPeriodo: '202320',
      grafoPrerrequisitos: new Map()
    })
  };

  beforeEach(async () => {
    mockMapper = {
      toPersistenceCatalog: jest.fn().mockReturnValue([]),
      avanceToPersistence: jest.fn().mockReturnValue([{ numero: 1, periodo: '202310', totalCreditos: 10, instancias: [] }]),
      futureToPersistence: jest.fn().mockReturnValue([]),
      toResponse: jest.fn(),
      toSummaryResponseList: jest.fn()
    };

    mockStrategyFactory = {
      createStrategy: jest.fn().mockReturnValue({
        generar: jest.fn().mockReturnValue(new Map())
      })
    };

    mockConsistencyService = {
      validarYCorregir: jest.fn().mockResolvedValue(true)
    };

    const mockManager = {
      create: jest.fn().mockImplementation((_, dto) => dto),
      save: jest.fn().mockImplementation((arg1, arg2) => {
          const data = arg2 ? arg2 : arg1;
          return Promise.resolve({ ...data, id: 1, idProyeccion: 1 });
      }),
      remove: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
      findOneBy: jest.fn().mockResolvedValue({ id: 1 }),
      
      getRepository: jest.fn().mockReturnValue({
        count: jest.fn().mockResolvedValue(1),
        findOne: jest.fn().mockResolvedValue({ id: 1, codigoAsignatura: 'MAT101' }),
        findOneBy: jest.fn().mockResolvedValue({ id: 1, codigoAsignatura: 'MAT101' }),
        find: jest.fn().mockResolvedValue([{ codigoAsignatura: 'MAT101' }]), 
        create: jest.fn(d => d),
        save: jest.fn(d => Promise.resolve({ ...d, id: 1 })),
        manager: { 
            getRepository: jest.fn().mockReturnThis() 
        }
      })
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockManager
    };

    const mockDataSource = {
      createQueryBuilder: jest.fn(),
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner)
    };

    mockProyeccionRepo = {
      create: jest.fn().mockImplementation(dto => dto),
      save: jest.fn().mockResolvedValue({ idProyeccion: 1 }),
      findOne: jest.fn(), 
      find: jest.fn().mockResolvedValue([]),
      remove: jest.fn(),
      manager: mockManager 
    };

    mockSemestreRepo = { 
        create: jest.fn(), 
        save: jest.fn(), 
        findOne: jest.fn(),
        manager: mockManager 
    };
    
    mockInstanciaRepo = { 
        create: jest.fn(),
        manager: mockManager, 
        find: jest.fn().mockResolvedValue([{ codigoAsignatura: 'MAT101' }]),
        createQueryBuilder: jest.fn(() => ({
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
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
    jest.clearAllMocks();
  });



  describe('proyeccionFutura', () => {
    it('debe orquestar la generación automática', async () => {
      mockProyeccionRepo.findOne.mockResolvedValue({ idProyeccion: 1, rutUsuario: '111', semestres: [] });
      mockMapper.toResponse.mockReturnValue({ id: 1 });

      await service.proyeccionFutura('111', '8606', '2020', { ideal: false } as any);

      expect(mockStrategyFactory.createStrategy).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('guardarSemestreManual', () => {
    it('debe guardar semestre y validar consistencia sin errores', async () => {
      const mockAsignaturasDto = [{ codigo: 'MAT101', creditos: 5 }];
      

      mockProyeccionRepo.findOne.mockResolvedValue({ 
          idProyeccion: 1, 
          codigoCarrera: '8606',
          rutUsuario: '111',
          semestres: [] 
      });
      
      mockSemestreRepo.findOne.mockResolvedValueOnce(null);
      mockMapper.toResponse.mockReturnValue({ id: 1 });

      await service.guardarSemestreManual(1, 2, '202410', mockAsignaturasDto as any, '2020');

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockConsistencyService.validarYCorregir).toHaveBeenCalled();
    });
  });

  describe('autocompletarProyeccion', () => {
    it('debe generar semestres futuros', async () => {
      mockProyeccionRepo.findOne.mockResolvedValue({ 
          idProyeccion: 1, rutUsuario: '111', codigoCarrera: '8606', semestres: [{ numero: 1, periodo: '202310' }] 
      });
      mockMapper.futureToPersistence.mockReturnValue([{ numero: 2, instancias: [] }]);
      mockMapper.toResponse.mockReturnValue({ id: 1 });

      await service.autocompletarProyeccion(1, '2020');

      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });



  describe('crearProyeccionConAvance', () => {
    it('debe crear y guardar una proyección simple', async () => {
        const dto = { nombreProyeccion: 'Nueva', ideal: false };
        

        mockProyeccionRepo.create.mockReturnValue(dto);

        mockProyeccionRepo.save.mockResolvedValue({ idProyeccion: 10 });

        mockProyeccionRepo.findOne.mockResolvedValue({ 
            idProyeccion: 10, 
            rutUsuario: '111', 
            semestres: [] 
        });

        mockMapper.toResponse.mockReturnValue({ id: 10 });

        await service.crearProyeccionConAvance('111', '2020', '8606', dto as any);

        expect(mockProyeccionRepo.save).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el nombre ya existe', async () => {

        mockProyeccionRepo.save.mockRejectedValue({ code: '23505' });
        
        await expect(
            service.crearProyeccionConAvance('111', '2020', '8606', { nombreProyeccion: 'Duplicada' } as any)
        ).rejects.toThrow(require('@nestjs/common').ConflictException);
    });
  });

  describe('eliminarProyeccion', () => {
      it('debe eliminar si el usuario es dueño', async () => {
          mockProyeccionRepo.findOne.mockResolvedValue({ idProyeccion: 1, rutUsuario: '111' });
          
          await service.eliminarProyeccion(1, '111'); 

          expect(mockProyeccionRepo.remove).toHaveBeenCalled();
      });

      it('debe lanzar Forbidden si el usuario no es dueño', async () => {
          mockProyeccionRepo.findOne.mockResolvedValue({ idProyeccion: 1, rutUsuario: 'OTRO' });
          
          await expect(
              service.eliminarProyeccion(1, 'YO')
          ).rejects.toThrow(require('@nestjs/common').ForbiddenException);
      });

      it('debe lanzar NotFound si no existe', async () => {
          mockProyeccionRepo.findOne.mockResolvedValue(null);
          await expect(service.eliminarProyeccion(99, '111')).rejects.toThrow(require('@nestjs/common').NotFoundException);
      });
  });

  describe('listarProyeccionesDeUsuario', () => {
      it('debe buscar y mapear la lista', async () => {
          mockProyeccionRepo.find.mockResolvedValue([]);
          await service.listarProyeccionesDeUsuario('111', '8606');
          expect(mockMapper.toSummaryResponseList).toHaveBeenCalled();
      });
  });

  describe('Helpers de Proyeccion Manual', () => {
      it('obtenerAsignaturasProyeccionManual debe funcionar', async () => {
          mockProyeccionRepo.findOne.mockResolvedValue({ 
              idProyeccion: 1, rutUsuario: '111', semestres: [] 
          });

          await service.obtenerAsignaturasProyeccionManual(1, '2020');
          expect(mockProyeccionRepo.findOne).toHaveBeenCalled();
      });

      it('obtenerAsignaturasExcepcion debe funcionar', async () => {
          mockProyeccionRepo.findOne.mockResolvedValue({ idProyeccion: 1, rutUsuario: '111', semestres: [] });

          await service.obtenerAsignaturasExcepcion(1, '2020', 'SIN_PREREQ');
          expect(mockProyeccionRepo.findOne).toHaveBeenCalled();
      });
  });

  describe('validarConsistenciaProyeccion', () => {
      it('debe capturar errores silenciosamente si falla la validación', async () => {
           mockConsistencyService.validarYCorregir.mockRejectedValue(new Error("Ups"));

           mockProyeccionRepo.findOne.mockResolvedValue({ 
               idProyeccion: 1, codigoCarrera: '8606', rutUsuario: '111', semestres: [] 
           });
           mockSemestreRepo.findOne.mockResolvedValue(null);
           mockMapper.toResponse.mockReturnValue({});

           await service.guardarSemestreManual(1, 1, '202410', [], '2020');
           
           expect(mockConsistencyService.validarYCorregir).toHaveBeenCalled();
      });
  });
});