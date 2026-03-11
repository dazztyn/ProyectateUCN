import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import AvanceDisplay from '../componentes/compAvanceDisplay'; 

// Mockear el componente hijo ErrorMessage para aislamiento
vi.mock('./compMensajeError', () => ({
    default: ({ message, onClose }: { message: string, onClose: () => void }) => (
        <div data-testid="error-message">
            <p>{message}</p>
            <button onClick={onClose}>Cerrar</button>
        </div>
    ),
}));

const TOKEN_AVANCE = 'TEST_AVANCE_TOKEN';
const INDICE_AVANCE = 1;

// Datos mockeados 
const mockDataAvance = {
    // Periodo 1er Semestre 
    "202310": [
        { nrc: "N1", period: "202310", course: { codigo: "MAT1", asignatura: "Cálculo", creditos: 8 }, status: "APROBADO" },
    ],
    // Periodo 2do Semestre 
    "202320": [
        { nrc: "N2", period: "202320", course: { codigo: "INF2", asignatura: "Datos", creditos: 6 }, status: "REPROBADO" },
    ],
    // Periodo Invierno 
    "202415": [
        { nrc: "N3", period: "202415", course: { codigo: "TALLER", asignatura: "Taller", creditos: 3 }, status: "CURSANDO" },
    ],
    // Periodo desconocido
    "202599": [
        { nrc: "N4", period: "202599", course: { codigo: "MISTERIO", asignatura: "Ramo Secreto", creditos: 3 }, status: "N/A" },
    ],
};

// Configuración del servidor mock
const serverAvance = setupServer(
    http.get(`http://localhost:3000/avance/${INDICE_AVANCE}`, ({ request }) => {
        if (request.headers.get('Authorization') !== `Bearer ${TOKEN_AVANCE}`) {
            return HttpResponse.json({ error: 'Token inválido' }, { status: 401 });
        }
        return HttpResponse.json(mockDataAvance, { status: 200 });
    }),
);

beforeAll(() => serverAvance.listen({ onUnhandledRequest: 'error' }));
afterEach(() => serverAvance.resetHandlers());
afterAll(() => serverAvance.close());

// --------------------------------------------------------------------------
// III. CASOS DE PRUEBA
// --------------------------------------------------------------------------

describe('AvanceDisplay Component - Carga, Transformación de Periodos y Estados', () => {

    it('1.Debería renderizar todos los periodos y asignaturas', async () => {
        render(<AvanceDisplay indice={INDICE_AVANCE} access_token={TOKEN_AVANCE} />);

        expect(screen.getByText('Cargando avance...')).toBeInTheDocument();


        await waitFor(() => {

            expect(screen.getByText('2023 - 1er Sem.')).toBeInTheDocument(); // 202310
            expect(screen.getByText('2023 - 2do Sem.')).toBeInTheDocument(); // 202320
            expect(screen.getByText('2024 - Invierno')).toBeInTheDocument();  // 202415
        });

 
        expect(screen.getByText('Cálculo')).toBeInTheDocument();
        expect(screen.getByText('INF2')).toBeInTheDocument();
    });

    // ----------------------------------------------------------------------
    // Casos Frontera de Lógica y Estilo (I.A.3)
    // ----------------------------------------------------------------------

    it('2.Debería manejar el tipo de periodo "Desconocido"', async () => {
        render(<AvanceDisplay indice={INDICE_AVANCE} access_token={TOKEN_AVANCE} />);

        await waitFor(() => {
            expect(screen.getByText('2025 - Desconocido')).toBeInTheDocument();
        });
    });

    it('3.debería aplicar la clase "aprobado" y mostrar el estado', async () => {
        render(<AvanceDisplay indice={INDICE_AVANCE} access_token={TOKEN_AVANCE} />);

        await waitFor(() => {

            const aprobadoElement = screen.getByText('Cálculo').closest('.asignatura-card');
            expect(aprobadoElement).toHaveClass('aprobado');
            expect(screen.getAllByText('APROBADO').length).toBeGreaterThanOrEqual(1);
        });
    });

    it('4.Debería aplicar la clase "reprobado"', async () => {
        render(<AvanceDisplay indice={INDICE_AVANCE} access_token={TOKEN_AVANCE} />);

        await waitFor(() => {
            
            const reprobadoElement = screen.getByText('Datos').closest('.asignatura-card');
            expect(reprobadoElement).toHaveClass('reprobado');
        });
    });

    it('5.Debería mostrar mensaje si la API devuelve objeto vacío', async () => {
        
        serverAvance.use(
            http.get(`http://localhost:3000/avance/${INDICE_AVANCE}`, () => {
                return HttpResponse.json({}, { status: 200 });
            }),
        );
        render(<AvanceDisplay indice={INDICE_AVANCE} access_token={TOKEN_AVANCE} />);

        await waitFor(() => {
            expect(screen.getByText('No se encontraron registros de avance.')).toBeInTheDocument();
        });
    });
});