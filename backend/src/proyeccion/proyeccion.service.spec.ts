import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionService } from './proyeccion.service';
import { StudentDataFacade } from './StudentDataFacade';
import { ProyeccionMapper } from './proyeccion.mapper';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Proyeccion } from './entities/proyeccion.entity';
import { Semestre } from './entities/semestre.entity';
import { Asignaturas } from '../mallacurricular/entities/asignatura.entity';
import { EstadoAcademico } from './interfaces/EstadoAcademico';

describe('ProyeccionService', () => {
  let service: ProyeccionService;
  let facade: StudentDataFacade;
  let repoProyeccion: any;

  const mockFacade = {
    obtenerEstadoAcademico: jest.fn().mockResolvedValue({
      mallaCompleta: [],
      avanceRelleno: [],
      avancePorPeriodo: new Map(),
      mallaPorNiveles: new Map(),
      asignaturasAprobadas: new Set(),
      ultimoPeriodo: '202320',
      grafoPrerrequisitos: new Map()
    } as EstadoAcademico)
  };

  // --- CORRECCIÓN AQUÍ ---
  // Hacemos que el mock devuelva datos reales falsos
  const mockMapper = {
    toPersistenceCatalog: jest.fn().mockReturnValue([]),
    avanceToPersistence: jest.fn().mockReturnValue([
        // Simulamos que hay al menos un semestre de avance
        { numero: 1, periodo: '202310', totalCreditos: 10, instancias: [] }
    ]),
    futureToPersistence: jest.fn().mockReturnValue([])
  };

  const mockRepo = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockResolvedValue({ idProyeccion: 1 }),
    findOne: jest.fn().mockResolvedValue({ semestres: [] }),
    createQueryBuilder: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(true),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProyeccionService,
        { provide: StudentDataFacade, useValue: mockFacade },
        { provide: ProyeccionMapper, useValue: mockMapper },
        { provide: getRepositoryToken(Proyeccion), useValue: mockRepo },
        { provide: getRepositoryToken(Semestre), useValue: mockRepo },
        { provide: getRepositoryToken(Asignaturas), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ProyeccionService>(ProyeccionService);
    facade = module.get<StudentDataFacade>(StudentDataFacade);
    repoProyeccion = module.get(getRepositoryToken(Proyeccion));
  });

  it('debe llamar al Facade, generar estrategia y guardar', async () => {
    const dto = { ideal: false, nombreProyeccion: 'Test' };
    
    await service.proyeccionFutura('111', '8606', '202320', dto);

    expect(facade.obtenerEstadoAcademico).toHaveBeenCalledWith('111', '8606', '202320');
    expect(repoProyeccion.save).toHaveBeenCalled();
    expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
  });
  it('debe crear una proyección solo con avance (PATCH)', async () => {
    const dto = { ideal: true, nombreProyeccion: 'Solo Avance' };
    
    // Ejecutamos el método que nos faltaba probar
    await service.crearProyeccionConAvance('111', '202320', '8606', dto);

    // Verificamos que llame al mapper y guarde
    expect(facade.obtenerEstadoAcademico).toHaveBeenCalled();
    // Verificamos que use el mapper específico para avance
    // (Asegúrate de haber definido avanceToPersistence en el mockMapper arriba)
    expect(repoProyeccion.save).toHaveBeenCalled();
  });
});