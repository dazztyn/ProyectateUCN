import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionMapper } from './proyeccion.mapper';
import { Asignatura } from '../ArchivosComunes/Asignatura';
import { AvanceConAsignatura } from '../avance/avance/AvanceConAsignatura';

describe('ProyeccionMapper', () => {
  let mapper: ProyeccionMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProyeccionMapper],
    }).compile();

    mapper = module.get<ProyeccionMapper>(ProyeccionMapper);
  });

  it('debe estar definido', () => {
    expect(mapper).toBeDefined();
  });

  it('toPersistenceCatalog debe convertir asignaturas a DTOs', () => {
    const malla: Asignatura[] = [{
        codigo: 'MAT101', asignatura: 'Calculo', creditos: 6, nivel: 1, prereq: ''
    }];
    
    const resultado = mapper.toPersistenceCatalog(malla);
    
    expect(resultado).toHaveLength(1);
    expect(resultado[0].codigoAsignatura).toBe('MAT101');
    expect(resultado[0].nombreAsignatura).toBe('Calculo');
  });

  it('avanceToPersistence debe convertir mapa de avance a semestres', () => {
    const asig = { codigo: 'MAT101', creditos: 6 } as Asignatura;
    const ramo = new AvanceConAsignatura('1', '202310', '111', asig, false, 'I', 'APROBADO');
    
    const mapa = new Map<string, AvanceConAsignatura[]>();
    mapa.set('202310', [ramo]);

    const resultado = mapper.avanceToPersistence(mapa);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].periodo).toBe('202310');
    expect(resultado[0].instancias[0].aprobada).toBe(true);
  });

  it('futureToPersistence debe convertir mapa futuro a semestres', () => {
    const asig = { codigo: 'MAT201', creditos: 6 } as Asignatura;
    const mapa = new Map<string, Asignatura[]>();
    mapa.set('202320', [asig]);

    const resultado = mapper.futureToPersistence(mapa, 2);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].numero).toBe(2);
    expect(resultado[0].instancias[0].aprobada).toBe(true);
  });
});