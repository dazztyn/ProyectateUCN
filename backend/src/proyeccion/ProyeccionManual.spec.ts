import { ProyeccionManual } from './ProyeccionManual';
import { EstadoAcademico } from './interfaces/EstadoAcademico';
import { Asignatura } from '../ArchivosComunes/Asignatura';

describe('ProyeccionManual', () => {
  // Datos Mock
  const mat1 = { codigo: 'M1', nivel: 1, prereq: '' } as Asignatura;
  const mat2 = { codigo: 'M2', nivel: 2, prereq: 'M1' } as Asignatura;
  const mat3 = { codigo: 'M3', nivel: 3, prereq: 'M2' } as Asignatura;

  const mockEstado: EstadoAcademico = {
    asignaturasAprobadas: new Set(),
    ultimoPeriodo: '202320',
    mallaPorNiveles: new Map([
      [1, [mat1]], [2, [mat2]], [3, [mat3]]
    ]),
    mallaCompleta: [], avanceRelleno: [], avancePorPeriodo: new Map(), grafoPrerrequisitos: new Map()
  };

  it('debe permitir seleccionar asignaturas sin requisitos (Nivel 1)', () => {
    const manual = new ProyeccionManual(mockEstado);
    const resultado = manual.enviarAsignaturas();

    expect(resultado.disponibles.map(a => a.codigo)).toContain('M1');
    expect(resultado.noDisponibles.map(a => a.codigo)).toContain('M2'); // M2 requiere M1
  });

  it('debe permitir seleccionar asignaturas con requisitos cumplidos', () => {
    // Simulamos que aprobó M1
    const estadoConAprobada = { ...mockEstado, asignaturasAprobadas: new Set(['M1']) };
    
    const manual = new ProyeccionManual(estadoConAprobada);
    const resultado = manual.enviarAsignaturas();

    // M1 ya no sale (está aprobada)
    // M2 debería salir disponible (requisito M1 cumplido)
    expect(resultado.disponibles.map(a => a.codigo)).toContain('M2');
    expect(resultado.noDisponibles.map(a => a.codigo)).toContain('M3'); // M3 requiere M2
  });
});