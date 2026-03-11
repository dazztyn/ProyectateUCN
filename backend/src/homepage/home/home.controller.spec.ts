import { Test, TestingModule } from '@nestjs/testing';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

describe('HomeController', () => {
  let controller: HomeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        // Aquí simulamos el servicio para que el test no falle
        {
          provide: HomeService,
          useValue: {
            // Si tu HomeService tiene métodos que el controlador llama al iniciarse,
            // puedes simularlos aquí. Por ahora, un objeto vacío suele bastar
            // para que el controlador se instancie.
            getData: jest.fn().mockReturnValue('Datos de prueba'), 
          } 
        }
      ],
    }).compile();

    controller = module.get<HomeController>(HomeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});