import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionController } from './proyeccion.controller';
import { ProyeccionService } from './proyeccion.service';
import { AuthGuard } from '@nestjs/passport';
import { BadRequestException } from '@nestjs/common';

describe('ProyeccionController', () => {
  let controller: ProyeccionController;
  let service: ProyeccionService;

  const mockUsuario = {
    rut: '11.111.111-1',
    carreras: [
      { codigo: '8606', catalogo: '2020' }, 
      { codigo: '2020', catalogo: '2019' } 
    ]
  };

  const mockRequest = {
    user: mockUsuario
  };

  const mockProyeccionService = {
    crearProyeccionConAvance: jest.fn(),
    proyeccionFutura: jest.fn(),
    guardarSemestreManual: jest.fn(),
    autocompletarProyeccion: jest.fn(),
    listarProyeccionesDeUsuario: jest.fn(),
    obtenerProyeccionCompleta: jest.fn(),
    obtenerAsignaturasProyeccionManual: jest.fn(),
    obtenerAsignaturasExcepcion: jest.fn(),
    eliminarProyeccion: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProyeccionController],
      providers: [
        {
          provide: ProyeccionService,
          useValue: mockProyeccionService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt')) 
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProyeccionController>(ProyeccionController);
    service = module.get<ProyeccionService>(ProyeccionService);
    
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });


  describe('patchCrearProyeccion (ProyeccionManual)', () => {
    it('debe crear una proyección si el índice de carrera es válido', async () => {
      const body = { nombreProyeccion: 'Test', ideal: false };
      mockProyeccionService.crearProyeccionConAvance.mockResolvedValue({ id: 1 });

      await controller.patchCrearProyeccion(mockRequest as any, '0', body as any);

      expect(service.crearProyeccionConAvance).toHaveBeenCalledWith(
        mockUsuario.rut,
        '2020',
        '8606',
        body
      );
    });

    it('debe lanzar BadRequestException si el índice es inválido', () => {
        expect(() => 
            controller.patchCrearProyeccion(mockRequest as any, '99', {} as any)
        ).toThrow(BadRequestException);
    });
  });

  describe('getProyeccionFutura (ProyeccionIdeal)', () => {
    it('debe llamar a proyeccionFutura con datos correctos', async () => {
      const body = { nombreProyeccion: 'Ideal', ideal: true };
      mockProyeccionService.proyeccionFutura.mockResolvedValue({ id: 2 });

      await controller.getProyeccionFutura(mockRequest as any, '0', body as any);

      expect(service.proyeccionFutura).toHaveBeenCalledWith(
        mockUsuario.rut,
        '8606',
        '2020',
        body
      );
    });
  });

  describe('actualizarProyeccion', () => {
    it('debe guardar un semestre manual', async () => {
      const asignaturasDto = [{ codigo: 'MAT101' }];
      mockProyeccionService.guardarSemestreManual.mockResolvedValue({ ok: true });

      await controller.actualizarProyeccion(
        mockRequest as any, 
        '0',
        '10',
        '2', 
        '202410',
        asignaturasDto as any
      );

      expect(service.guardarSemestreManual).toHaveBeenCalledWith(
        10,
        2,
        '202410',
        asignaturasDto,
        '2020' 
      );
    });
  });

  describe('autocompletarProyeccion', () => {
    it('debe llamar al servicio de autocompletado', async () => {
      await controller.autocompletarProyeccion(mockRequest as any, '0', '15');

      expect(service.autocompletarProyeccion).toHaveBeenCalledWith(
        15, 
        '2020'
      );
    });
  });

  describe('obtenerProyecciones', () => {
    it('debe listar las proyecciones del usuario', async () => {
      mockProyeccionService.listarProyeccionesDeUsuario.mockResolvedValue([]);

      await controller.obtenerProyecciones(mockRequest as any, '0');

      expect(service.listarProyeccionesDeUsuario).toHaveBeenCalledWith(
        mockUsuario.rut,
        '8606'
      );
    });
  });

  describe('obtenerProyeccionCompleta', () => {
    it('debe obtener una proyección por ID', async () => {
      mockProyeccionService.obtenerProyeccionCompleta.mockResolvedValue({ id: 50 });

      await controller.obtenerProyeccionCompleta('50');

      expect(service.obtenerProyeccionCompleta).toHaveBeenCalledWith(50);
    });
  });

  describe('obtenerAsignaturasDisponibles', () => {
    it('debe retornar asignaturas disponibles', async () => {
      mockProyeccionService.obtenerAsignaturasProyeccionManual.mockResolvedValue([]);

      await controller.obtenerAsignaturasDisponibles(
        mockRequest as any, 
        '0', 
        '100',
        '3' 
      );

      expect(service.obtenerAsignaturasProyeccionManual).toHaveBeenCalledWith(
        100,
        '2020',
        3
      );
    });

    it('debe funcionar sin semestreObjetivo', async () => {
        await controller.obtenerAsignaturasDisponibles(
          mockRequest as any, 
          '0', 
          '100', 
          undefined
        );
  
        expect(service.obtenerAsignaturasProyeccionManual).toHaveBeenCalledWith(
          100,
          '2020',
          undefined
        );
      });
  });

  describe('obtenerAsignaturasExcepcion', () => {
    it('debe retornar excepciones válidas', async () => {
        mockProyeccionService.obtenerAsignaturasExcepcion.mockResolvedValue([]);

        await controller.obtenerAsignaturasExcepcion(
            mockRequest as any,
            '0',
            '100',
            'SIN_PREREQ',
            '5'
        );

        expect(service.obtenerAsignaturasExcepcion).toHaveBeenCalledWith(
            100,
            '2020',
            'SIN_PREREQ',
            5
        );
    });

    it('debe lanzar error si el tipo de excepción es inválido', () => {
        expect(() => 
            controller.obtenerAsignaturasExcepcion(
                mockRequest as any, '0', '100', undefined as any, undefined
            )
        ).toThrow(BadRequestException);
    });
  });

  describe('eliminarProyeccion', () => {
    it('debe eliminar la proyección validando el usuario', async () => {
      await controller.eliminarProyeccion(mockRequest as any, '999');

      expect(service.eliminarProyeccion).toHaveBeenCalledWith(
        999,
        mockUsuario.rut
      );
    });
  });
});