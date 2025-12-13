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

// Datos mockeados de la API: Incluye todos los casos de periodo y status
const mockDataAvance = {
    // Periodo 1er Semestre (Tipo "10")
    "202310": [
        { nrc: "N1", period: "202310", course: { codigo: "MAT1", asignatura: "Cálculo", creditos: 8 }, status: "APROBADO" },
    ],
    // Periodo 2do Semestre (Tipo "20")
    "202320": [
        { nrc: "N2", period: "202320", course: { codigo: "INF2", asignatura: "Datos", creditos: 6 }, status: "REPROBADO" },
    ],
    // Periodo Invierno (Tipo "15")
    "202415": [
        { nrc: "N3", period: "202415", course: { codigo: "TALLER", asignatura: "Taller", creditos: 3 }, status: "CURSANDO" },
    ],
    // Periodo desconocido (Caso Límite)
    "202599": [
        { nrc: "N4", period: "202599", course: { codigo: "MISTERIO", asignatura: "Ramo Secreto", creditos: 3 }, status: "N/A" },
    ],
};

// Configuración del servidor MSW (Mock Service Worker)
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

    it('1. Caso de Éxito: Debería renderizar todos los periodos y asignaturas (I.A.2)', async () => {
        render(<AvanceDisplay indice={INDICE_AVANCE} access_token={TOKEN_AVANCE} />);

        // 1. Debe mostrar el estado de carga inicial
        expect(screen.getByText('Cargando avance...')).toBeInTheDocument();

        // 2. Esperar a que se carguen y transformen los periodos
        await waitFor(() => {
            // Verifica transformación de periodos (Lógica getPeriodoNombre)
            expect(screen.getByText('2023 - 1er Sem.')).toBeInTheDocument(); // 202310
            expect(screen.getByText('2023 - 2do Sem.')).toBeInTheDocument(); // 202320
            expect(screen.getByText('2024 - Invierno')).toBeInTheDocument();  // 202415
        });

        // 3. Verifica asignaturas y códigos
        expect(screen.getByText('Cálculo')).toBeInTheDocument();
        expect(screen.getByText('INF2')).toBeInTheDocument();
    });

    // ----------------------------------------------------------------------
    // Casos Frontera de Lógica y Estilo (I.A.3)
    // ----------------------------------------------------------------------

    it('2. Caso Límite: Debería manejar el tipo de periodo "Desconocido" (I.A.3)', async () => {
        render(<AvanceDisplay indice={INDICE_AVANCE} access_token={TOKEN_AVANCE} />);

        await waitFor(() => {
            // Verifica el caso 202599 (default en el switch)
            expect(screen.getByText('2025 - Desconocido')).toBeInTheDocument();
        });
    });

    it('3. Caso de Estilo: Debería aplicar la clase "aprobado" y mostrar el estado (I.A.3)', async () => {
        render(<AvanceDisplay indice={INDICE_AVANCE} access_token={TOKEN_AVANCE} />);

        await waitFor(() => {
            // Encuentra la tarjeta de la asignatura APROBADA (MAT1)
            const aprobadoElement = screen.getByText('Cálculo').closest('.asignatura-card');
            expect(aprobadoElement).toHaveClass('aprobado');
            expect(screen.getAllByText('APROBADO').length).toBeGreaterThanOrEqual(1);
        });
    });

    it('4. Caso de Estilo: Debería aplicar la clase "reprobado" (I.A.3)', async () => {
        render(<AvanceDisplay indice={INDICE_AVANCE} access_token={TOKEN_AVANCE} />);

        await waitFor(() => {
            // Encuentra la tarjeta de la asignatura REPROBADA (INF2)
            const reprobadoElement = screen.getByText('Datos').closest('.asignatura-card');
            expect(reprobadoElement).toHaveClass('reprobado');
        });
    });

    it('5. Caso de Excepción: Debería mostrar mensaje si la API devuelve objeto vacío (I.A.3)', async () => {
        // Mockear una respuesta 200 OK pero con data vacía
        serverAvance.use(
            http.get(`http://localhost:3000/avance/${INDICE_AVANCE}`, () => {
                return HttpResponse.json({}, { status: 200 });
            }),
        );
        render(<AvanceDisplay indice={INDICE_AVANCE} access_token={TOKEN_AVANCE} />);

        // Esperar el mensaje de "No se encontraron registros de avance."
        await waitFor(() => {
            expect(screen.getByText('No se encontraron registros de avance.')).toBeInTheDocument();
        });
    });
});