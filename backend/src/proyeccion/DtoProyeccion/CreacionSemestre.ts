import { CreacionInstanciaAsignatura } from "./CreacionInstanciaAsignatura";

export class CreacionSemestre
{
    numero: number;
    periodo: string;
    editable: boolean;
    totalCreditos: number;
    instancias: CreacionInstanciaAsignatura[];
}