import { ProyeccionFutura } from './ProyeccionFutura';
import { Asignatura } from '../ArchivosComunes/Asignatura';

// --- DATOS DE PRUEBA (MOCKS) ---
const asigCalc1: Asignatura = { codigo: 'MAT1', asignatura: 'Calc I', creditos: 10, nivel: 1, prereq: '' };
const asigCalc2: Asignatura = { codigo: 'MAT2', asignatura: 'Calc II', creditos: 10, nivel: 2, prereq: 'MAT1' };
const asigProg1: Asignatura = { codigo: 'PROG1', asignatura: 'Progra I', creditos: 20, nivel: 1, prereq: '' }; 
const asigRelleno: Asignatura = { codigo: 'GEN1', asignatura: 'General', creditos: 5, nivel: 1, prereq: '' };

describe('ProyeccionFutura (Algoritmo)', () => {

    const crearMalla = (asignaturas: Asignatura[]) => {
        const mapa = new Map<number, Asignatura[]>();
        asignaturas.forEach(a => {
            if (!mapa.has(a.nivel)) mapa.set(a.nivel, []);
            mapa.get(a.nivel)?.push(a);
        });
        return mapa;
    };

    const crearImportancia = () => new Map<string, Asignatura[]>();

    it('debería generar una proyección vacía si ya aprobó todo', () => {
        const malla = crearMalla([asigCalc1]);
        const aprobadas = ['MAT1'];
        
        const algoritmo = new ProyeccionFutura(malla, crearImportancia(), aprobadas, '202510');
        const resultado = algoritmo.generarProyeccionOptima();

        expect(resultado.size).toBe(0);
    });

    it('debería respetar la cadena de prerrequisitos (No tomar Calc II antes de Calc I)', () => {
        const malla = crearMalla([asigCalc1, asigCalc2]);
        const aprobadas: string[] = [];

        const algoritmo = new ProyeccionFutura(malla, crearImportancia(), aprobadas, '202510');
        const resultado = algoritmo.generarProyeccionOptima();

        // Obtener todos los periodos generados en orden
        const periodos = Array.from(resultado.keys()).sort();
        
        // Primer semestre proyectado
        const primerPeriodo = periodos[0];
        const semestre1 = resultado.get(primerPeriodo);

        // Verificar que Calc 1 está en el primer semestre
        expect(semestre1).toBeDefined();
        expect(semestre1?.find(a => a.codigo === 'MAT1')).toBeDefined();
        expect(semestre1?.find(a => a.codigo === 'MAT2')).toBeUndefined();

        // Si hay un segundo periodo, verificar Calc 2
        if (periodos.length > 1) {
            const segundoPeriodo = periodos[1];
            const semestre2 = resultado.get(segundoPeriodo);
            
            expect(semestre2).toBeDefined();
            expect(semestre2?.find(a => a.codigo === 'MAT2')).toBeDefined();
        }
    });

    it('debería respetar el límite de 30 créditos por semestre', () => {
        const malla = crearMalla([asigCalc1, asigProg1, asigRelleno]);
        const aprobadas: string[] = [];

        const algoritmo = new ProyeccionFutura(malla, crearImportancia(), aprobadas, '202510');
        const resultado = algoritmo.generarProyeccionOptima();
        
        const periodos = Array.from(resultado.keys()).sort();
        const asignaturasSemestre1 = resultado.get(periodos[0]) || [];
        
        const totalCreditos = asignaturasSemestre1.reduce((sum, a) => sum + a.creditos, 0);

        expect(totalCreditos).toBeLessThanOrEqual(30);
        expect(asignaturasSemestre1.length).toBeLessThan(3);
        
        // Verificar que hay un segundo semestre con asignaturas
        expect(periodos.length).toBeGreaterThan(1);
        const asignaturasSemestre2 = resultado.get(periodos[1]) || [];
        expect(asignaturasSemestre2.length).toBeGreaterThan(0);
    });

    it('debería manejar correctamente el cambio de periodo (Invierno/Verano)', () => {
        const malla = crearMalla([asigCalc1]);
        const algoritmo = new ProyeccionFutura(malla, crearImportancia(), [], '202415'); 
        const resultado = algoritmo.generarProyeccionOptima();
        
        const periodos = Array.from(resultado.keys());
        expect(periodos.length).toBeGreaterThan(0);
        expect(periodos[0]).toBe('202420');
    });
});