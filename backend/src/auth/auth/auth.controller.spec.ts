import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  // 1. Creamos un Mock del AuthService
  // Simulamos que el método login devuelve un token falso exitoso
  const mockAuthService = {
    login: jest.fn(() => Promise.resolve({ 
        access_token: 'token_falso_de_prueba', 
        usuario: { rut: '111111111', carreras: [] } 
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        // 2. Inyectamos el Mock en lugar del servicio real
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Test extra: Verificar que el login llame al servicio correctamente
  it('should call authService.login on login', async () => {
    const loginDto = { email: 'test@ucn.cl', password: '123' };
    await controller.login(loginDto);
    expect(mockAuthService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
  });
});