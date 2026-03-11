import { ProyeccionManual } from './ProyeccionManual';
import { EstadoAcademico} from './interfaces/EstadoAcademico';
import { Asignatura } from '../ArchivosComunes/Asignatura';

describe('ProyeccionManual', () => {

  const mat1 = { codigo: 'M1', nivel: 1, prereq: '', creditos: 5 } as Asignatura;
  const mat2 = { codigo: 'M2', nivel: 2, prereq: 'M1', creditos: 5 } as Asignatura;
  const mat3 = { codigo: 'M3', nivel: 3, prereq: 'M2', creditos: 5 } as Asignatura;

  const mockEstado: EstadoAcademico = {
    asignaturasAprobadas: new Set(),
    ultimoPeriodo: '202320',
    mallaPorNiveles: new Map([
      [1, [mat1]], [2, [mat2]], [3, [mat3]]
    ]),
    mallaCompleta: [mat1, mat2, mat3], 
    avancePlanoLista: [], 
    avancePorPeriodo: new Map(), 
    grafoPrerrequisitos: new Map()
  };

  it('debe bloquear M2 en flujo normal (por falta de requisitos)', () => {
    const manual = new ProyeccionManual(mockEstado);
    const resultado = manual.enviarAsignaturasNormales();

    expect(resultado.disponibles.map(a => a.codigo)).toContain('M1');
    expect(resultado.noDisponibles.map(a => a.codigo)).toContain('M2');
  });

  it('debe permitir M2 si se solicita SIN_PREREQ (Levantamiento de requisitos)', () => {
    const manual = new ProyeccionManual(mockEstado);

    const candidatos = manual.enviarCandidatosExcepcion('SIN_PREREQ');

    expect(candidatos.map(a => a.codigo)).toContain('M2');
  });

  it('debe traer asignaturas de un semestre extra si se solicita EXTRA_SEMESTRE', () => {

    const mat4 = { codigo: 'M4', nivel: 4, prereq: '', creditos: 5 } as Asignatura;
    
    const estadoExtendido = { ...mockEstado };
    estadoExtendido.mallaPorNiveles = new Map([
        [1, [mat1]], [2, [mat2]], [3, [mat3]], [4, [mat4]]
    ]);

    const manual = new ProyeccionManual(estadoExtendido);
    const candidatos = manual.enviarCandidatosExcepcion('EXTRA_SEMESTRE');

    expect(candidatos.map(a => a.codigo)).toContain('M4');
  });
});