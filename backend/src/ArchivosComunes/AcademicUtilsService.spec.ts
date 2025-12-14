import { Test, TestingModule } from '@nestjs/testing';
import { AcademicUtilsService } from './AcademicUtilsService';
import { Asignatura } from './Asignatura';

describe('AcademicUtilsService', () => {
  let service: AcademicUtilsService;

  // Datos de prueba (Mock Data)
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
        { codigo: 'A', prereq: 'X,B' }, // X no existe
        { codigo: 'B', prereq: '' }
      ] as Asignatura[];

      const resultado = service.limpiarPrerrequisitosInvalidos(mallaSucia);
      
      expect(resultado[0].prereq).toBe('B'); // X desapareció
    });
  });

  describe('construirGrafoDeApertura', () => {
    it('debe mapear correctamente qué asignaturas abren a cuáles', () => {
      const grafo = service.construirGrafoDeApertura(mockMalla);
      
      // 1. Obtenemos el valor de forma segura
      const dependenciasMat101 = grafo.get('MAT101');

      // 2. Verificamos que EXISTA (Si es undefined, el test falla aquí)
      expect(dependenciasMat101).toBeDefined();
      
      // 3. Verificamos que tenga elementos
      expect(dependenciasMat101).toHaveLength(1);

      // 4. Ahora sí accedemos con seguridad usando '!' (Non-null assertion)
      // El signo '!' le dice a TypeScript: "Confía en mí, ya verifiqué que esto no es nulo arriba"
      expect(dependenciasMat101![0].codigo).toBe('MAT201');
      
      // Verificación negativa
      const dependenciasMat201 = grafo.get('MAT201');
      // Puede ser undefined o un array vacío, dependiendo de tu implementación.
      // Si tu implementación inicializa todo con [], entonces:
      expect(dependenciasMat201).toBeDefined();
      expect(dependenciasMat201).toHaveLength(0);
    });
  });

  describe('agruparPor', () => {
    it('debe agrupar asignaturas por nivel', () => {
      const grupos = service.agruparPor(mockMalla, (a) => a.nivel);
      
      expect(grupos.get(1)).toHaveLength(2); // MAT101, FIS101
      expect(grupos.get(2)).toHaveLength(1); // MAT201
    });
  });
});