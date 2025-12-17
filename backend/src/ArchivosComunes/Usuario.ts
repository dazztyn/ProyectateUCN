import { Carrera } from "../ArchivosComunes/Carrera";

export interface Usuario
{
    rut: string;
    carreras: Carrera[];
}