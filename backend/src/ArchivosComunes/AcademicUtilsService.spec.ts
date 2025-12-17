import { Test, TestingModule } from '@nestjs/testing';
import { AcademicUtilsService } from './AcademicUtilsService';
import { Asignatura } from './Asignatura';

describe('AcademicUtilsService', () => {
  let service: AcademicUtilsService;

  const mockMalla: Asignatura[] = [
    { codigo: 'MAT101', asignatura: 'Calculo I', creditos: 6, nivel: 1, prereq: '' } as any,
    { codigo: 'FIS101', asignatura: 'Fisica I', creditos: 6, nivel: 1, prereq: '' } as any,
    { codigo: 'MAT201', asignatura: 'Calculo II', creditos: 6, nivel: 2, prereq: 'MAT101' } as any,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcademicUtilsService],
    }).compile();

    service = module.get<AcademicUtilsService>(AcademicUtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('limpiarPrerrequisitosInvalidos', () => {
    it('debe eliminar prerrequisitos que no existen en la malla', () => {
      const mallaSucia = [
        { codigo: 'A', prereq: 'X,B' }, 
        { codigo: 'B', prereq: '' }
      ] as Asignatura[];

      const resultado = service.limpiarPrerrequisitosInvalidos(mallaSucia);
      
      expect(resultado[0].prereq).toBe('B');
    });
  });

  describe('construirGrafoDeApertura', () => {
    it('debe mapear correctamente qué asignaturas abren a cuáles', () => {
      const grafo = service.construirGrafoDeApertura(mockMalla);

      const dependenciasMat101 = grafo.get('MAT101');

      expect(dependenciasMat101).toBeDefined();

      expect(dependenciasMat101).toHaveLength(1);

      expect(dependenciasMat101![0].codigo).toBe('MAT201');

      const dependenciasMat201 = grafo.get('MAT201');

      expect(dependenciasMat201).toBeDefined();
      expect(dependenciasMat201).toHaveLength(0);
    });
  });

  describe('agruparPor', () => {
    it('debe agrupar asignaturas por nivel', () => {
      const grupos = service.agruparPor(mockMalla, (a) => a.nivel);
      
      expect(grupos.get(1)).toHaveLength(2);
      expect(grupos.get(2)).toHaveLength(1);
    });
  });
});