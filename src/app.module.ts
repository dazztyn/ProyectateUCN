
import { Module } from '@nestjs/common';
import { AlumnoModule } from './alumno/alumno/alumno.module';
import { MallaModule } from './mallacurricular/malla/malla.module';
import { AuthModule } from './auth/auth/auth.module';
import { AvanceModule } from './avance/avance/avance.module';
import { HomeModule } from './homepage/home/home.module';

@Module({
  imports: [
    AlumnoModule,
    MallaModule,
    AuthModule,
    AvanceModule,
    HomeModule,
  ],
})
export class AppModule {}