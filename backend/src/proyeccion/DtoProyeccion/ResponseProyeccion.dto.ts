export class ResponseAsignaturaDto 
{
    codigo: string;
    nombre?: string;
    estado: 'APROBADO' | 'PENDIENTE' | 'REPROBADO'; 
}

export class ResponseSemestreDto 
{
    numero: number;
    periodo: string;
    totalCreditos: number;
    asignaturas: ResponseAsignaturaDto[];
}

export class ResponseProyeccionDto 
{
    id: number;
    rut: string;
    nombre: string;
    esIdeal: boolean;
    fechaCreacion?: Date;
    semestres: ResponseSemestreDto[];
}

