import { Carrera } from "src/ArchivosComunes/Carrera";

export interface Usuario
{
    rut: string;
    carreras: Carrera[];
}