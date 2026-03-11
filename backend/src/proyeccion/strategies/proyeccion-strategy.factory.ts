import { Injectable } from '@nestjs/common';
import { IProyeccionStrategy } from './IProyeccionStrategy';
import { GreedyProjectionStrategy } from './GreedyProjectionStrategy';
import { EstadoAcademico } from '../interfaces/EstadoAcademico';

@Injectable()
export class ProyeccionStrategyFactory 
{

    createStrategy(tipo: 'GREEDY', estado: EstadoAcademico): IProyeccionStrategy {
        switch (tipo) {
            case 'GREEDY':
                return new GreedyProjectionStrategy(estado);
            default:
                throw new Error('Estrategia de proyección desconocida');
        }
    }
}