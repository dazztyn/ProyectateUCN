import { GreedyProjectionStrategy } from './GreedyProjectionStrategy';
import { EstadoAcademico } from '../interfaces/EstadoAcademico';
import { Asignatura } from '../../ArchivosComunes/Asignatura';

describe('GreedyProjectionStrategy', () => {
  // Mock de Asignaturas
  const mat1 = { codigo: 'M1', creditos: 10, nivel: 1, prereq: '' } as Asignatura;
  const fis1 = { codigo: 'F1', creditos: 10, nivel: 1, prereq: '' } as Asignatura;
  const mat2 = { codigo: 'M2', creditos: 10, nivel: 2, prereq: 'M1' } as Asignatura;
  const fis2 = { codigo: 'F2', creditos: 10, nivel: 2, prereq: 'F1' } as Asignatura;
  const tesis = { codigo: 'TES', creditos: 30, nivel: 9, prereq: 'M2,F2' } as Asignatura;

  // Mock del Estado Académico (Lo que devolvería el Facade)
  const mockEstado: EstadoAcademico = {
    asignaturasAprobadas: new Set(),
    ultimoPeriodo: '202320', // Último cursado
    mallaPorNiveles: new Map([
      [1, [mat1, fis1]],
      [2, [mat2, fis2]],
      [9, [tesis]]
    ]),
    grafoPrerrequisitos: new Map([
      ['M1', [mat2]], ['F1', [fis2]], ['M2', [tesis]], ['F2', [tesis]]
    ]),
    // Campos no usados por el algoritmo directo pero requeridos por interfaz
    mallaCompleta: [], avanceRelleno: [], avancePorPeriodo: new Map()
  };

    it('debe proyectar el primer semestre correctamente', () => {
        const strategy = new GreedyProjectionStrategy(mockEstado);
        const resultado = strategy.generar();

        const periodoSiguiente = '202410';
        
        // 1. Verificamos que la clave exista en el mapa
        expect(resultado.has(periodoSiguiente)).toBe(true);
        
        // 2. Obtenemos el valor
        const asignaturas = resultado.get(periodoSiguiente);
        
        // 3. Verificamos que no sea undefined
        expect(asignaturas).toBeDefined();
        
        // 4. Ahora usamos '!' para decirle a TS que es seguro
        expect(asignaturas!).toHaveLength(2);
        expect(asignaturas!.map(a => a.codigo)).toContain('M1');
        expect(asignaturas!.map(a => a.codigo)).toContain('F1');
    });

    it('debe respetar los prerrequisitos (No sugerir M2 si M1 no está aprobada)', () => {
        const strategy = new GreedyProjectionStrategy(mockEstado);
        const resultado = strategy.generar();
        
        const periodoSubSiguiente = '202420';
        
        // 1. Obtenemos y verificamos
        const asignaturas = resultado.get(periodoSubSiguiente);
        expect(asignaturas).toBeDefined();
        
        // 2. Usamos '!' para acceder
        expect(asignaturas!.map(a => a.codigo)).toContain('M2');
    });

    it('debe respetar el límite de créditos (Caso Borde)', () => {
        // Simulamos que ya aprobó todo lo previo a la tesis
        const estadoAvanzado = { ...mockEstado, asignaturasAprobadas: new Set(['M1', 'F1', 'M2', 'F2']) };
        const strategy = new GreedyProjectionStrategy(estadoAvanzado);
        
        const resultado = strategy.generar();
        
        const periodoProyeccion = '202410';
        const asignaturas = resultado.get(periodoProyeccion);

        // 1. Verificamos existencia
        expect(asignaturas).toBeDefined();
        
        // 2. Verificamos que el array tenga elementos antes de acceder a la posición 0
        expect(asignaturas!.length).toBeGreaterThan(0);

        // 3. Acceso seguro
        expect(asignaturas![0].codigo).toBe('TES');
    });
});