import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasService } from './estadisticas.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InstanciaAsignatura } from '../proyeccion/entities/InstanciaAsignatura.entity';

describe('EstadisticasService', () => {
  let service: EstadisticasService;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          codigo: 'MAT001',
          nombre: 'Calculo I',
          total_intentos: '100', 
          total_reprobados: '50',
          total_inscritos: '200'
        }
      ]),
    };

    // 2. Mock del Repositorio
    const mockRepo = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadisticasService,
        {
          provide: getRepositoryToken(InstanciaAsignatura),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<EstadisticasService>(EstadisticasService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('obtenerRankingReprobacion', () => {
    it('debe calcular correctamente los porcentajes', async () => {
      const resultado = await service.obtenerRankingReprobacion('8606');
      
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('codigoCarrera'), 
        expect.anything()
      );
      expect(resultado[0]).toEqual({
        codigo: 'MAT001',
        nombre: 'Calculo I',
        total_intentos: 100, 
        total_reprobados: 50      
      });
    });

    it('debe filtrar por periodo si se provee', async () => {
      await service.obtenerRankingReprobacion('8606', 5, '202310');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('semestre.periodo'), 
        expect.anything()
      );
    });
  });

  describe('obtenerMasDemandadas', () => {
    it('debe retornar lista de inscritos', async () => {
      const resultado = await service.obtenerMasDemandadas('8606', '202410');
      
      expect(resultado[0]).toEqual({
        codigo: 'MAT001',
        nombre: 'Calculo I',
        total_inscritos: 200  
      });
    });
  });
});