import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionService } from './proyeccion.service';
import { StudentDataFacade } from './StudentDataFacade';
import { ProyeccionMapper } from './proyeccion.mapper';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Proyeccion } from './entities/proyeccion.entity';
import { Semestre } from './entities/semestre.entity';
import { InstanciaAsignatura } from './entities/InstanciaAsignatura.entity'; // Añadido
import { EstadoAcademico, AvancePlano } from './interfaces/EstadoAcademico';
import { DataSource } from 'typeorm'; // Añadido

describe('ProyeccionService', () => {
  let service: ProyeccionService;
  let facade: StudentDataFacade;
  let repoProyeccion: any;

  // Mock del Estado actualizado
  const mockFacade = {
    obtenerEstadoAcademico: jest.fn().mockResolvedValue({
      mallaCompleta: [],
      avancePlanoLista: [], // Nuevo campo
      avancePorPeriodo: new Map<string, AvancePlano[]>(), // Tipado nuevo
      mallaPorNiveles: new Map(),
      asignaturasAprobadas: new Set(),
      ultimoPeriodo: '202320',
      grafoPrerrequisitos: new Map()
    } as EstadoAcademico)
  };

  const mockMapper = {
    toPersistenceCatalog: jest.fn().mockReturnValue([]),
    avanceToPersistence: jest.fn().mockReturnValue([
        { numero: 1, periodo: '202310', totalCreditos: 10, instancias: [] }
    ]),
    futureToPersistence: jest.fn().mockReturnValue([]),
    toResponse: jest.fn(), // Añadidos para evitar errores de undefined
    toSummaryResponseList: jest.fn()
  };

  // Mock complejo para TypeORM y Transacciones
  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn().mockImplementation((entity, dto) => dto), // Simula crear entidad
      save: jest.fn().mockResolvedValue({ idProyeccion: 1 }),
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

  const mockRepo = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockResolvedValue({ idProyeccion: 1, semestres: [] }),
    findOne: jest.fn().mockResolvedValue({ semestres: [] }),
    find: jest.fn().mockResolvedValue([])
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProyeccionService,
        { provide: StudentDataFacade, useValue: mockFacade },
        { provide: ProyeccionMapper, useValue: mockMapper },
        { provide: DataSource, useValue: mockDataSource }, // Inyectamos DataSource
        { provide: getRepositoryToken(Proyeccion), useValue: mockRepo },
        { provide: getRepositoryToken(Semestre), useValue: mockRepo },
        { provide: getRepositoryToken(InstanciaAsignatura), useValue: mockRepo }, // Repo Instancia
      ],
    }).compile();

    service = module.get<ProyeccionService>(ProyeccionService);
    facade = module.get<StudentDataFacade>(StudentDataFacade);
    repoProyeccion = module.get(getRepositoryToken(Proyeccion));
  });

  it('debe llamar al Facade, generar estrategia y guardar', async () => {
    const dto = { ideal: false, nombreProyeccion: 'Test' };
    
    await service.proyeccionFutura('111', '8606', '2020', dto);

    // Ahora se llama con 3 argumentos (rut, carrera, catalogo)
    expect(facade.obtenerEstadoAcademico).toHaveBeenCalledWith('111', '8606', '2020');
    // Save se llama dentro de la transacción en el QueryRunner
    expect(mockQueryRunner.manager.save).toHaveBeenCalled();
  });

  it('debe crear una proyección solo con avance', async () => {
    const dto = { ideal: true, nombreProyeccion: 'Solo Avance' };
    
    // patch: crearProyeccionConAvance(rut, catalogo, codigoCarrera, dto)
    await service.crearProyeccionConAvance('111', '2020', '8606', dto);

    expect(facade.obtenerEstadoAcademico).toHaveBeenCalled();
    // Verificamos que se use el repo normal (no transacción) para este caso simple
    expect(repoProyeccion.save).toHaveBeenCalled();
  });
});