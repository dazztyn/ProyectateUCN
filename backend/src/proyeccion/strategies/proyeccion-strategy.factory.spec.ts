import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionStrategyFactory } from './proyeccion-strategy.factory';
import { GreedyProjectionStrategy } from './GreedyProjectionStrategy';
import { EstadoAcademico } from '../interfaces/EstadoAcademico';

describe('ProyeccionStrategyFactory', () => {
  let factory: ProyeccionStrategyFactory;

  // Mock básico de EstadoAcademico
  const mockEstado = {
    asignaturasAprobadas: new Set(),
    ultimoPeriodo: '202320',
    mallaPorNiveles: new Map(),
    grafoPrerrequisitos: new Map(),
    mallaCompleta: [],
    avancePlanoLista: [],
    avancePorPeriodo: new Map()
  } as unknown as EstadoAcademico;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProyeccionStrategyFactory],
    }).compile();

    factory = module.get<ProyeccionStrategyFactory>(ProyeccionStrategyFactory);
  });

  it('debe estar definida', () => {
    expect(factory).toBeDefined();
  });

  it('debe crear una instancia de GreedyProjectionStrategy cuando el tipo es GREEDY', () => {
    const estrategia = factory.createStrategy('GREEDY', mockEstado);
    expect(estrategia).toBeInstanceOf(GreedyProjectionStrategy);
  });

  it('debe lanzar un error si se solicita una estrategia desconocida', () => {
    expect(() => {
      // @ts-ignore para forzar el error de tipo en el test
      factory.createStrategy('GENETICO_SUPER_AI', mockEstado);
    }).toThrow();
  });
});