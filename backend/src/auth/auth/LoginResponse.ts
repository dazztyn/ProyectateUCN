import { Carrera } from "src/ArchivosComunes/Carrera";

export interface LoginResponse
{
    rut: string;
    carreras: Carrera[];
}