import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolUsuario } from './entities/rol-usuario.entity';
import { UnauthorizedException } from '@nestjs/common';

// mock de datos de admin en bd local
const mockAdminUser = {
  email: 'admin@ucn.cl',
  password: 'admin123',
  rol: 'admin',
  rut: '11.111.111-1',
};

const mockStudentResponse = {
  rut: '20.200.200-2',
  carreras: [{ codigo: 'ICCI', nombre: 'Ingeniería' }],
};

describe('AuthService', () => {
  let service: AuthService;
  let rolRepository;
  let jwtService;

  beforeEach(async () => {
    
    // Mock del Repositorio de Roles
    const mockRolRepository = {
      findOne: jest.fn(),
    };

    // Mock del servicio JWT
    const mockJwtService = {
      sign: jest.fn(() => 'TOKEN_FALSO_GENERADO'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(RolUsuario),
          useValue: mockRolRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    rolRepository = module.get(getRepositoryToken(RolUsuario));
    jwtService = module.get(JwtService);

    // Esto evita que el test intente conectarse a internet real
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- TESTS UNITARIOS ---

  describe('login', () => {
    
    // CASO 1: Admin Local (Éxito)
    it('debería loguear al admin sin llamar a la API externa', async () => {
      // Configuración: El repo encuentra al usuario admin
      rolRepository.findOne.mockResolvedValue(mockAdminUser);

      const result = await service.login('admin@ucn.cl', 'admin123');

      // Verificaciones
      expect(rolRepository.findOne).toHaveBeenCalledWith({ where: { email: 'admin@ucn.cl' } });
      expect(result.role).toBe('admin');
      expect(result.access_token).toBe('TOKEN_FALSO_GENERADO');
      expect(global.fetch).not.toHaveBeenCalled(); // IMPORTANTE: No tocó la API UCN
    });

    // CASO 2: Admin Local (Contraseña Incorrecta)
    it('debería lanzar UnauthorizedException si la contraseña del admin está mal', async () => {
      // Configuración: Encuentra al usuario, pero la pass no coincidirá
      rolRepository.findOne.mockResolvedValue(mockAdminUser);

      // Ejecución y verificación de error
      await expect(service.login('admin@ucn.cl', 'CLAVE_MALA'))
        .rejects
        .toThrow(UnauthorizedException);
        
      expect(global.fetch).not.toHaveBeenCalled(); // Seguridad: no filtrar credenciales admin a la UCN
    });

    // CASO 3: Estudiante (Usuario no está en BD local -> Va a API UCN)
    it('debería llamar a la API UCN si no es admin local', async () => {
      // Configuración: El repo NO encuentra nada (es null)
      rolRepository.findOne.mockResolvedValue(null);

      // Configuración: fetch retorna éxito simulado
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockStudentResponse,
      });

      const result = await service.login('alumno@ucn.cl', 'passAlumno');

      // Verificaciones
      expect(rolRepository.findOne).toHaveBeenCalled(); // Buscó localmente primero
      expect(global.fetch).toHaveBeenCalled();          // Como no encontró, fue a la API
      expect(result.role).toBe('student');
      expect(result.usuario.rut).toBe(mockStudentResponse.rut);
    });

    // CASO 4: Estudiante (Fallo en API UCN)
    it('debería lanzar error si la API UCN falla o credenciales son malas', async () => {
      rolRepository.findOne.mockResolvedValue(null);

      // Configuración: fetch retorna error simulado
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'Credenciales incorrectas' }),
      });

      await expect(service.login('alumno@ucn.cl', 'passMala'))
        .rejects
        .toThrow(); // Esperamos cualquier error genérico
    });
  });
});