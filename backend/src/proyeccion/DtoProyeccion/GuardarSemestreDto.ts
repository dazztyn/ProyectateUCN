import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class AsignaturaInputDto 
{
    @IsNotEmpty()
    @IsString()
    codigo: string;

    @IsString()
    asignatura: string;

    @IsNumber()
    creditos: number;

    @IsNumber()
    nivel: number;
}