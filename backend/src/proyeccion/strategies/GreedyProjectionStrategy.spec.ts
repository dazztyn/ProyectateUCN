import { GreedyProjectionStrategy } from './GreedyProjectionStrategy';
import { EstadoAcademico, AvancePlano } from '../interfaces/EstadoAcademico';
import { Asignatura } from '../../ArchivosComunes/Asignatura';

describe('GreedyProjectionStrategy', () => {
  // Datos Mock
  const mat1 = { codigo: 'M1', creditos: 10, nivel: 1, prereq: '' } as Asignatura;
  const fis1 = { codigo: 'F1', creditos: 10, nivel: 1, prereq: '' } as Asignatura;
  const mat2 = { codigo: 'M2', creditos: 10, nivel: 2, prereq: 'M1' } as Asignatura;
  
  const mockEstadoBase: EstadoAcademico = {
    asignaturasAprobadas: new Set(),
    ultimoPeriodo: '202320', 
    mallaPorNiveles: new Map([
      [1, [mat1, fis1]],
      [2, [mat2]]
    ]),
    grafoPrerrequisitos: new Map([['M1', [mat2]]]),
    mallaCompleta: [mat1, fis1, mat2], 
    avancePlanoLista: [],
    avancePorPeriodo: new Map()
  };

  it('debe proyectar correctamente usando el estado del constructor', () => {
    
    const strategy = new GreedyProjectionStrategy(mockEstadoBase);

    const resultado = strategy.generar();

    const periodo1 = '202410';
    expect(resultado.has(periodo1)).toBe(true);
    const ramosPeriodo1 = resultado.get(periodo1);

    expect(ramosPeriodo1?.map(r => r.codigo)).toContain('M1');
    expect(ramosPeriodo1?.map(r => r.codigo)).toContain('F1');
    expect(ramosPeriodo1?.map(r => r.codigo)).not.toContain('M2');
  });

  it('debe desbloquear ramos en el siguiente semestre simulado', () => {
    const strategy = new GreedyProjectionStrategy(mockEstadoBase);
    const resultado = strategy.generar();

    const periodo2 = '202420';
    const ramosPeriodo2 = resultado.get(periodo2);
    
    expect(ramosPeriodo2).toBeDefined();
    expect(ramosPeriodo2?.map(r => r.codigo)).toContain('M2');
  });
});