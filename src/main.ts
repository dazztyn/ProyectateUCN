import { NestFactory } from '@nestjs/core';
import { AlumnoModule } from './alumno/alumno/alumno.module';
import { MallaModule} from './mallacurricular/malla/malla.module';
import { AuthModule } from './auth//auth/auth.module';
import { AvanceModule } from './avance/avance/avance.module';
import { HomeModule } from './homepage/home/home.module';

async function bootstrap() 
{
    const app = await NestFactory.create(HomeModule);
    await app.listen(3000);
    
}
bootstrap();
