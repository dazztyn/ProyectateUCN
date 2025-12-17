import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionMapper } from './proyeccion.mapper';
import { Asignatura } from '../ArchivosComunes/Asignatura';
import { AvancePlano } from './interfaces/EstadoAcademico';

describe('ProyeccionMapper', () => {
  let mapper: ProyeccionMapper;
  const mockCarrera = '8606';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProyeccionMapper],
    }).compile();
    mapper = module.get<ProyeccionMapper>(ProyeccionMapper);
  });

  it('avanceToPersistence debe ignorar semestres de verano (15) para el contador de semestre académico', () => {
    
    const mapa = new Map<string, AvancePlano[]>();
    mapa.set('202310', [{ codigo: 'A', creditos: 5 } as any]);
    mapa.set('202315', [{ codigo: 'B', creditos: 5 } as any]); 
    mapa.set('202320', [{ codigo: 'C', creditos: 5 } as any]);

    const resultado = mapper.avanceToPersistence(mapa, mockCarrera);

    const sem1 = resultado.find(s => s.periodo === '202310');
    const semVerano = resultado.find(s => s.periodo === '202315');
    const sem2 = resultado.find(s => s.periodo === '202320');

    expect(sem1?.numero).toBe(1);
    expect(semVerano?.numero).toBe(2);
    expect(resultado).toHaveLength(3);
  });
});