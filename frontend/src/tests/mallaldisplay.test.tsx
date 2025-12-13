import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import MallaCarrera from '../componentes/compMallaDisplay'
// Mockear 
vi.mock('../componentes/compMensajeError', () => ({
    default: ({ message, onClose }: { message: string, onClose: () => void }) => (
        <div data-testid="error-message">
            <p>{message}</p>
            <button onClick={onClose}>Cerrar</button>
        </div>
    ),
}));

const TOKEN = 'TEST_MALLA_TOKEN';
const INDICE = 1;

const mockDataMalla = {
    "1": [
        { codigo: "INF101", asignatura: "Intro Programación", creditos: 6, prereq: [] as string[], nivel: 1 },
        { codigo: "MAT100", asignatura: "Cálculo I", creditos: 8, prereq: [] as string[], nivel: 1 },
    ],
    "2": [
        { codigo: "INF102", asignatura: "Algoritmos", creditos: 6, prereq: "INF101,MAT100", nivel: 2 },
        { codigo: "MAT200", asignatura: "Cálculo II", creditos: 8, prereq: ["MAT100"], nivel: 2 },
    ],
};

const server = setupServer(
    http.get(`http://localhost:3000/malla/${INDICE}`, ({ request }) => {
        if (request.headers.get('Authorization') !== `Bearer ${TOKEN}`) {
            return HttpResponse.json({ error: 'Token inválido' }, { status: 401 });
        }
        return HttpResponse.json(mockDataMalla, { status: 200 });
    }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// --------------------------------------------------------------------------
// III. CASOS DE PRUEBA
// --------------------------------------------------------------------------

describe('MallaCarrera Component - Carga y Transformación de Datos', () => {

    it('1. Caso de Éxito: Debería cargar y renderizar semestres y asignaturas correctamente (I.A.2)', async () => {
        render(<MallaCarrera indice={INDICE} access_token={TOKEN} />);

        expect(screen.getByText('Cargando malla...')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('1° Sem.')).toBeInTheDocument();
            expect(screen.getByText('INF101')).toBeInTheDocument();
            expect(screen.getAllByText('Créditos: 6').length).toBeGreaterThanOrEqual(1);
            expect(screen.getByText('2° Sem.')).toBeInTheDocument();
            expect(screen.getByText('Algoritmos')).toBeInTheDocument();
        });
    });

    it('2. Caso Límite: Debería manejar el parsing de prerequisitos correctamente (I.A.3 - Casos Frontera)', async () => {
        render(<MallaCarrera indice={INDICE} access_token={TOKEN} />);

        await waitFor(() => {

            expect(screen.getByText('Cálculo II')).toBeInTheDocument();
        });

    });
    
    // ----------------------------------------------------------------------
    // Casos de Error y Excepción
    // ----------------------------------------------------------------------

    it('3. Caso de Excepción: Debería manejar la falla de la API (status 500 o red) (I.A.3)', async () => {
        server.use(
            http.get(`http://localhost:3000/malla/${INDICE}`, () => {
                return HttpResponse.json({}, { status: 500 });
            }),
        );
        render(<MallaCarrera indice={INDICE} access_token={TOKEN} />);

        await waitFor(() => {
            expect(screen.getByText('No se pudo obtener la malla curricular.')).toBeInTheDocument();
            expect(screen.getByTestId('error-message')).toBeInTheDocument();
        });
    });

    it('4. Caso de Frontera: Debería mostrar mensaje si la API devuelve objeto vacío (I.A.3)', async () => {
        // Mockear una respuesta 200 OK pero con data vacía
        server.use(
            http.get(`http://localhost:3000/malla/${INDICE}`, () => {
                return HttpResponse.json({}, { status: 200 });
            }),
        );
        render(<MallaCarrera indice={INDICE} access_token={TOKEN} />);

        await waitFor(() => {
            expect(screen.getByText('No se encontraron semestres.')).toBeInTheDocument();
        });
    });
});