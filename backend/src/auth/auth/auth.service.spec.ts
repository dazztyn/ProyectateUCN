import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolUsuario } from './entities/rol-usuario.entity';
import { AvanceService } from '../../avance/avance/avance.service';
import { MallaService } from '../../mallacurricular/malla/malla.service';
import { UnauthorizedException } from '@nestjs/common';

global.fetch = jest.fn();

describe('AuthService', () => {
  let service: AuthService;
  let rolRepo: any;
  let avanceService: any;
  let mallaService: any;
  let jwtService: any;

  const mockJwtService = { sign: jest.fn().mockReturnValue('token') };
  const mockRolRepo = { findOne: jest.fn() };
  const mockAvanceService = { sincronizarAvanceFull: jest.fn() };
  const mockMallaService = { sincronizarMalla: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(RolUsuario), useValue: mockRolRepo },
        { provide: AvanceService, useValue: mockAvanceService },
        { provide: MallaService, useValue: mockMallaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    rolRepo = module.get(getRepositoryToken(RolUsuario));
    avanceService = module.get(AvanceService);
    mallaService = module.get(MallaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('debe loguear admin local correctamente', async () => {
      mockRolRepo.findOne.mockResolvedValue({ 
          email: 'admin@ucn.cl', password: '123', rol: 'admin', rut: 'ADMIN' 
      });
      
      const res = await service.login('admin@ucn.cl', '123');
      expect(res.access_token).toBe('token');
      expect(res.role).toBe('admin');
    });

    it('debe fallar admin local con password incorrecta', async () => {
        mockRolRepo.findOne.mockResolvedValue({ password: '123' });
        await expect(service.login('admin', 'bad')).rejects.toThrow(UnauthorizedException);
    });

    it('debe loguear alumno externo y disparar sincronizacion', async () => {
      mockRolRepo.findOne.mockResolvedValue(null);
      
      const mockAlumno = { 
          rut: '1-9', 
          carreras: [{ codigo: '8606', catalogo: '2020' }] 
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAlumno,
      });

      const res = await service.login('alumno', 'pass');
      
      expect(res.role).toBe('student');
      expect(avanceService.sincronizarAvanceFull).toHaveBeenCalled();
      expect(mallaService.sincronizarMalla).toHaveBeenCalled();
    });

    it('debe manejar error de API externa', async () => {
        mockRolRepo.findOne.mockResolvedValue(null);
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false, status: 500, statusText: 'Error'
        });
        await expect(service.login('a', 'b')).rejects.toThrow();
    });
  });
});