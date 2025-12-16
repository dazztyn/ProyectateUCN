import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionMapper } from './proyeccion.mapper';
import { Asignatura } from '../ArchivosComunes/Asignatura';
import { AvancePlano } from './interfaces/EstadoAcademico';

describe('ProyeccionMapper', () => {
  let mapper: ProyeccionMapper;
  const mockCarrera = '8606'; // Codigo carrera dummy

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProyeccionMapper],
    }).compile();

    mapper = module.get<ProyeccionMapper>(ProyeccionMapper);
  });

  it('debe estar definido', () => {
    expect(mapper).toBeDefined();
  });

  it('toPersistenceCatalog debe convertir asignaturas a DTOs con carrera', () => {
    const malla: Asignatura[] = [{
        codigo: 'MAT101', asignatura: 'Calculo', creditos: 6, nivel: 1, prereq: ''
    }];
    
    // Ahora recibe codigoCarrera
    const resultado = mapper.toPersistenceCatalog(malla, mockCarrera);
    
    expect(resultado).toHaveLength(1);
    expect(resultado[0].codigoAsignatura).toBe('MAT101');
    expect(resultado[0].codigoCarrera).toBe(mockCarrera); // Verificamos la carrera
    expect(resultado[0].nombreAsignatura).toBe('Calculo');
  });

  it('avanceToPersistence debe convertir mapa de avance PLANO a semestres', () => {
    // Usamos un objeto plano (AvancePlano), NO la clase AvanceConAsignatura
    const ramo: AvancePlano = {
        nrc: '123',
        periodo: '202310',
        rut: '111',
        codigo: 'MAT101',
        asignatura: 'Calculo I',
        creditos: 6,
        estado: 'APROBADO',
        tipo: 'N'
    };
    
    const mapa = new Map<string, AvancePlano[]>();
    mapa.set('202310', [ramo]);

    // Ahora recibe codigoCarrera
    const resultado = mapper.avanceToPersistence(mapa, mockCarrera);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].periodo).toBe('202310');
    // Verificamos que mapee correctamente la PK compuesta
    expect(resultado[0].instancias[0].asignatura.codigoAsignatura).toBe('MAT101');
    expect(resultado[0].instancias[0].asignatura.codigoCarrera).toBe(mockCarrera); 
  });

  it('futureToPersistence debe convertir mapa futuro a semestres', () => {
    const asig = { codigo: 'MAT201', creditos: 6 } as Asignatura;
    const mapa = new Map<string, Asignatura[]>();
    mapa.set('202320', [asig]);

    // Ahora recibe codigoCarrera como tercer argumento
    const resultado = mapper.futureToPersistence(mapa, 2, mockCarrera);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].numero).toBe(2);
    expect(resultado[0].instancias[0].asignatura.codigoCarrera).toBe(mockCarrera);
  });
});