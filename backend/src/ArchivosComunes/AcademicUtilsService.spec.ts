import { Test, TestingModule } from '@nestjs/testing';
import { AcademicUtilsService } from './AcademicUtilsService';
import { Asignatura } from './Asignatura';

describe('AcademicUtilsService', () => {
  let service: AcademicUtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcademicUtilsService],
    }).compile();

    service = module.get<AcademicUtilsService>(AcademicUtilsService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('limpiarPrerrequisitosInvalidos', () => {
    it('debe eliminar prerequisitos que no existen en la lista de asignaturas', () => {
      const input: Asignatura[] = [
        { codigo: 'MAT001', asignatura: 'Calc I', creditos: 5, nivel: 1, prereq: '' },
        { codigo: 'MAT002', asignatura: 'Calc II', creditos: 5, nivel: 2, prereq: 'MAT001,FANTASMA' }, 
      ];
      const result = service.limpiarPrerrequisitosInvalidos(input);
      expect(result[1]).toBeDefined();
      expect(result[1].prereq).toBe('MAT001');
    });

    it('debe manejar asignaturas sin prerequisitos', () => {
        const input: Asignatura[] = [{ codigo: 'A', asignatura: 'A', creditos: 1, nivel: 1, prereq: '' }];
        const result = service.limpiarPrerrequisitosInvalidos(input);
        
        expect(result[0].prereq).toBe(''); 
    });
  });

  describe('construirGrafoDeApertura', () => {
    it('debe mapear qué asignaturas abre cada ramo', () => {
      const input: Asignatura[] = [
        { codigo: 'A', asignatura: 'A', creditos: 1, nivel: 1, prereq: '' },
        { codigo: 'B', asignatura: 'B', creditos: 1, nivel: 2, prereq: 'A' },
      ];
      const grafo = service.construirGrafoDeApertura(input);
      
      expect(grafo.get('A')).toBeDefined();
      expect(grafo.get('A')!.length).toBe(1);
      
      expect(grafo.get('A')![0].codigo).toBe('B');
      
      expect(grafo.get('B')).toBeDefined();
      expect(grafo.get('B')!.length).toBe(0);
    });
  });

  describe('obtenerObjetosPrerrequisitos', () => {
    it('debe retornar mapa con objetos completos', () => {
      const objA = { codigo: 'A', asignatura: 'A', creditos: 1, nivel: 1, prereq: '' };
      const objB = { codigo: 'B', asignatura: 'B', creditos: 1, nivel: 2, prereq: 'A' };
      
      const mapa = service.obtenerObjetosPrerrequisitos([objA, objB]);
      
      expect(mapa.get('B')).toBeDefined();
      expect(mapa.get('B')!.length).toBeGreaterThan(0);
      expect(mapa.get('B')![0]).toEqual(objA);
    });
  });

  describe('agruparPor', () => {
    it('debe agrupar elementos por una clave', () => {
      const items = [
        { id: 1, grupo: 'A' },
        { id: 2, grupo: 'B' },
        { id: 3, grupo: 'A' },
      ];
      const mapa = service.agruparPor(items, (i) => i.grupo);
      
      expect(mapa.get('A')).toBeDefined();
      expect(mapa.get('A')!.length).toBe(2);
      
      expect(mapa.get('B')).toBeDefined();
      expect(mapa.get('B')!.length).toBe(1);
    });
  });

  describe('obtenerCodigosAprobados', () => {
    it('debe retornar set con codigos aprobados o inscritos', () => {
      const mockAvance = [
        { getCourse: () => ({ codigo: 'A' }), getStatus: () => 'APROBADO' },
        { getCourse: () => ({ codigo: 'B' }), getStatus: () => 'REPROBADO' },
        { getCourse: () => ({ codigo: 'C' }), getStatus: () => 'INSCRITO' },
      ];
      
      const set = service.obtenerCodigosAprobados(mockAvance as any);
      expect(set.has('A')).toBe(true);
      expect(set.has('B')).toBe(false);
      expect(set.has('C')).toBe(true);
    });
  });

  describe('buscarAsignatura', () => {
      it('debe encontrar asignatura por codigo', () => {
          const malla = [{ codigo: 'A', asignatura: 'A', creditos: 1, nivel: 1, prereq: ''}];
          const res = service.buscarAsignatura('A', malla);
          
          expect(res).toBeDefined();
          expect(res!.codigo).toBe('A');
      });

      it('debe retornar undefined si no existe', () => {
        const res = service.buscarAsignatura('Z', []);
        expect(res).toBeUndefined();
      });
  });
});