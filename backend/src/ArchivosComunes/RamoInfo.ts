import { Asignatura } from "./Asignatura";

export class RamoInfo
{
    codigo:string;
    asignatura:string;
    creditos:number;
    nivel:number;
    prereq: Asignatura[];
    asignaturasQueAbre: Asignatura[];

    constructor(codigo:string, asignatura:string, creditos:number, nivel:number)
    {
        this.codigo = codigo;
        this.asignatura = asignatura;
        this.creditos = creditos;
        this.nivel = nivel;
        this.prereq = [];
        this.asignaturasQueAbre = [];
    }

    rellenarAsignaturasQueAbre(asignatura: Asignatura)
    {
        this.asignaturasQueAbre.push(asignatura);
    }

    rellenarPrerrequisitos(asignatura: Asignatura)
    {
        this.prereq.push(asignatura);
    }

}