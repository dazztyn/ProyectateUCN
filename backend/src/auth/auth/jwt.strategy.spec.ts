import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  it('debe lanzar error si JWT_SECRET no existe', async () => {
    const mockConfig = { get: jest.fn().mockReturnValue(undefined) };
    
    await expect(Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfig }
      ],
    }).compile()).rejects.toThrow();
  });

  it('debe validarse correctamente', async () => {
    const mockConfig = { get: jest.fn().mockReturnValue('secreto_test') };
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfig }
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    const payload = { rut: '1-9', carreras: [] } as any;
    const result = await strategy.validate(payload);
    
    expect(result).toEqual({ rut: '1-9', carreras: [] });
  });
});