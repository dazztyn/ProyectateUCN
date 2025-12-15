
import { Module } from '@nestjs/common';
import { AlumnoModule } from './alumno/alumno/alumno.module.js';
import { MallaModule } from './mallacurricular/malla/malla.module.js';
import { AuthModule } from './auth/auth/auth.module.js';
import { AvanceModule } from './avance/avance/avance.module.js';
import { HomeModule } from './homepage/home/home.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProyeccionModule } from './proyeccion/proyeccion.module.js';
import { EstadisticasModule } from './estadisticas/estadisticas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false, 
        migrations: ['dist/migrations/*.js'],
      }),
    }),
    AlumnoModule,
    MallaModule,
    AuthModule,
    AvanceModule,
    HomeModule,
    ProyeccionModule,
    EstadisticasModule,
  ],
})
export class AppModule {}