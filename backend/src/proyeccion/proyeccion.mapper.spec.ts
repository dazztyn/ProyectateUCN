import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionMapper } from './proyeccion.mapper';
import { Proyeccion } from './entities/proyeccion.entity';
import { Asignatura } from '../ArchivosComunes/Asignatura';
import { AvancePlano } from './interfaces/EstadoAcademico';

describe('ProyeccionMapper', () => {
  let mapper: ProyeccionMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProyeccionMapper],
    }).compile();

    mapper = module.get<ProyeccionMapper>(ProyeccionMapper);
  });

  describe('toPersistenceCatalog', () => {
    it('debe mapear correctamente un array de asignaturas', () => {
      const input: Asignatura[] = [{
        codigo: 'MAT001',
        asignatura: 'Calculo',
        creditos: 5,
        nivel: 1,
        prereq: 'FIS001'
      }];
      
      const result = mapper.toPersistenceCatalog(input, '8606');
      
      expect(result[0].codigoAsignatura).toBe('MAT001');
      expect(result[0].prerrequisitos).toBe('FIS001');
    });

    it('debe manejar prerequisitos string simple', () => {
        const input: Asignatura[] = [{
            codigo: 'MAT002', asignatura: 'A', creditos: 0, nivel: 1,
            prereq: 'NONE' // Caso String
        }];
        const result = mapper.toPersistenceCatalog(input, '8606');
        expect(result[0].prerrequisitos).toBe('NONE');
    });
  });

  describe('avanceToPersistence', () => {
    it('debe generar semestres incrementales y manejar periodos especiales', () => {
      const mapa = new Map<string, AvancePlano[]>();

      mapa.set('202310', [{ 
          codigo: 'A', 
          creditos: 5, 
          estado: 'APROBADO',
          nrc: '1001',
          periodo: '202310',
          rut: '11.111.111-1',
          asignatura: 'Asignatura A',
          tipo: 'REGULAR'
      }]); 
      
      mapa.set('202315', [{ 
          codigo: 'B', 
          creditos: 2, 
          estado: 'APROBADO',
          nrc: '1002',
          periodo: '202315',
          rut: '11.111.111-1',
          asignatura: 'Asignatura B',
          tipo: 'VERANO'
      }]); 
      
      const result = mapper.avanceToPersistence(mapa, '8606');

      expect(result).toHaveLength(2);
      expect(result[0].numero).toBe(1);
      expect(result[1].numero).toBe(2);
    });
    
    it('debe manejar mapas vacíos', () => {
        const result = mapper.avanceToPersistence(new Map(), '8606');
        expect(result).toEqual([]);
    });
  });

  describe('futureToPersistence', () => {
    it('debe generar semestres futuros correctamente', () => {
      const futureMap = new Map<string, Asignatura[]>();
      futureMap.set('202410', [{ codigo: 'FUT1', creditos: 5 } as any]);
      
      const result = mapper.futureToPersistence(futureMap, 5, '8606'); 

      expect(result[0].numero).toBe(5);
      expect(result[0].instancias[0].estado).toBe('PENDIENTE');
    });

    it('debe manejar mapa vacío o undefined', () => {
        const result = mapper.futureToPersistence(new Map(), 1, '8606');
        expect(result).toEqual([]);
    });
  });

  describe('toResponse', () => {
    it('debe mapear entidad a DTO filtrando nulos', () => {
      const entidad: Proyeccion = {
        idProyeccion: 1,
        rutUsuario: '1-9',
        nombreProyeccion: 'Test',
        ideal: true,
        semestres: [
            { 
                numero: 1, 
                periodo: '202310', 
                totalCreditos: 10, 
                editable: false,
                instancias: [
                    { asignatura: { codigoAsignatura: 'OK', nombreAsignatura: 'Ok', creditos: 5 }, estado: 'APROBADO' } as any,
                    { asignatura: null, estado: 'PENDIENTE' } as any 
                ] 
            } as any
        ]
      } as any;

      const response = mapper.toResponse(entidad);

      expect(response.semestres[0].asignaturas).toHaveLength(1);
      expect(response.semestres[0].asignaturas[0].codigo).toBe('OK');
    });

    it('debe manejar entidad sin semestres', () => {
        const entidad = { idProyeccion: 1, semestres: null } as any;
        const response = mapper.toResponse(entidad);
        expect(response.semestres).toEqual([]);
    });
  });

  describe('toSummaryResponseList', () => {
      it('debe mapear lista de entidades', () => {
          const lista = [{ idProyeccion: 1, nombreProyeccion: 'A', ideal: true } as any];
          const res = mapper.toSummaryResponseList(lista);
          expect(res[0].nombre).toBe('A');
      });
  });
});