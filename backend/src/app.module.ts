
import { Module } from '@nestjs/common';
import { AlumnoModule } from './alumno/alumno/alumno.module.js';
import { MallaModule } from './mallacurricular/malla/malla.module.js';
import { AuthModule } from './auth/auth/auth.module.js';
import { AvanceModule } from './avance/avance/avance.module.js';
import { HomeModule } from './homepage/home/home.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    AlumnoModule,
    MallaModule,
    AuthModule,
    AvanceModule,
    HomeModule,
  ],
})
export class AppModule {}