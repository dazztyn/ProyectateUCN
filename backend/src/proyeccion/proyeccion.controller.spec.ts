import { Test, TestingModule } from '@nestjs/testing';
import { ProyeccionController } from './proyeccion.controller';
import { ProyeccionService } from './proyeccion.service';
import { Request } from 'express';

describe('ProyeccionController', () => {
  let controller: ProyeccionController;
  let service: ProyeccionService;

  const mockService = {
    proyeccionFutura: jest.fn(),
    listarProyeccionesDeUsuario: jest.fn(),
    obtenerProyeccionCompleta: jest.fn(),
    guardarSemestreManual: jest.fn(),
    autocompletarProyeccion: jest.fn(),
    obtenerEstadisticas: jest.fn(),
    obtenerAsignaturasProyeccionManual: jest.fn(),
    crearProyeccionConAvance: jest.fn()
  };

  const mockRequest = {
    user: {
      rut: '111',
      carreras: [{ codigo: '8606', catalogo: '2020' }]
    }
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProyeccionController],
      providers: [
        { provide: ProyeccionService, useValue: mockService }
      ],
    }).compile();

    controller = module.get<ProyeccionController>(ProyeccionController);
    service = module.get<ProyeccionService>(ProyeccionService);
  });

  it('debe listar proyecciones', async () => {
    await controller.obtenerProyecciones(mockRequest, '0');
    expect(service.listarProyeccionesDeUsuario).toHaveBeenCalledWith('111', '8606');
  });

  it('debe obtener una proyección completa', async () => {
    await controller.obtenerProyeccionCompleta('1');
    expect(service.obtenerProyeccionCompleta).toHaveBeenCalledWith(1);
  });

  it('debe actualizar una proyección (guardar semestre manual)', async () => {
    // Datos de prueba (Array de asignaturas)
    const mockAsignaturasDto = [{ codigo: 'MAT101', creditos: 5, nivel: 1 }];
    
    // Llamada usando el nombre REAL del método en tu controlador
    await controller.actualizarProyeccion(
        mockRequest, 
        '0',          // indiceCarrera
        '1',          // idProyeccion
        '1',          // numeroSemestre
        '202410',     // periodo
        mockAsignaturasDto as any // Body
    );
    
    // Verificar que el servicio reciba los datos transformados
    expect(service.guardarSemestreManual).toHaveBeenCalledWith(
        1,                  // idProyeccion
        1,                  // numeroSemestre
        '202410',           // periodo
        mockAsignaturasDto, // array asignaturas
        '2020'              // catalogo
    );
  });

  it('debe autocompletar proyección', async () => {
    await controller.autocompletarProyeccion(mockRequest, '0', '1');
    expect(service.autocompletarProyeccion).toHaveBeenCalledWith(1, '2020');
  });

});