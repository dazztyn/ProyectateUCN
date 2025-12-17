import { Asignatura } from "../../ArchivosComunes/Asignatura.js";


export class AvanceConAsignatura
{
    private nrc: string;
    private period: string;
    private student: string;
    private course: Asignatura;
    private excluded: boolean;
    private inscriptionType: string;
    private status: string;

    constructor(nrc: string, period: string, student: string, course: Asignatura, excluded: boolean, inscriptionType: string, status: string)
    {
        this.nrc = nrc;
        this.period = period;
        this.student = student;
        this.course = course;
        this.excluded = excluded;
        this.inscriptionType = inscriptionType;
        this.status = status;
    }

    getNrc(): string
    {
        return this.nrc;
    }

    getPeriod(): string
    {
        return this.period;
    }
    
    getStatus(): string
    {
        return this.status;
    }

    getCourse(): Asignatura
    {
        return this.course;
    }
}