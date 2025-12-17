import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolUsuario } from './entities/rol-usuario.entity';
import { AvanceService } from '../../avance/avance/avance.service';
import { MallaService } from '../../mallacurricular/malla/malla.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let avanceService: AvanceService;
  let mallaService: MallaService;


  const mockJwtService = { sign: jest.fn(() => 'token_mock') };
  const mockRepo = { findOne: jest.fn() };
  
  const mockAvanceService = { 
    sincronizarAvanceFull: jest.fn().mockResolvedValue(true) 
  };
  const mockMallaService = { 
    sincronizarMalla: jest.fn().mockResolvedValue(true) 
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(RolUsuario), useValue: mockRepo },
        { provide: AvanceService, useValue: mockAvanceService },
        { provide: MallaService, useValue: mockMallaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    avanceService = module.get<AvanceService>(AvanceService);
    mallaService = module.get<MallaService>(MallaService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('debe loguear estudiante y ejecutar sincronización en segundo plano', async () => {
      const mockAlumnoAPI = {
        rut: '11111111-1',
        carreras: [{ codigo: '8606', catalogo: '2020' }]
      };
      
      jest.spyOn(service, 'fetchloginData').mockResolvedValue(mockAlumnoAPI as any);

      const resultado = await service.login('test@ucn.cl', '1234');

      expect(resultado).toHaveProperty('access_token', 'token_mock');
      expect(resultado.role).toBe('student');

      expect(avanceService.sincronizarAvanceFull).toHaveBeenCalledWith('11111111-1', '8606', '2020');
      expect(mallaService.sincronizarMalla).toHaveBeenCalledWith('8606', '2020');
    });

    it('debe permitir login aunque falle la sincronización (Tolerancia a fallos)', async () => {
      const mockAlumnoAPI = {
        rut: '11111111-1',
        carreras: [{ codigo: '8606', catalogo: '2020' }]
      };
      jest.spyOn(service, 'fetchloginData').mockResolvedValue(mockAlumnoAPI as any);
      
      jest.spyOn(avanceService, 'sincronizarAvanceFull').mockRejectedValue(new Error('API UCN Caída'));

      await expect(service.login('test@ucn.cl', '1234')).resolves.toHaveProperty('access_token');
    });
  });
});