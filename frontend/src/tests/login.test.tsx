import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import Login from '../paginas/pagLogin'; 
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// --------------------------------------------------------------------------
// I. MOCKS 
// --------------------------------------------------------------------------

const mockedUseNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as object;
    return {
        ...actual,
        useNavigate: () => mockedUseNavigate, // Sobreescribe useNavigate
    };
});


const server = setupServer(
    http.post('http://localhost:3000/auth/login', () => {
        return HttpResponse.json({ access_token: 'TOKEN_DE_PRUEBA_123' }, { status: 200 });
    }),
);

const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = String(value); }),
        clear: vi.fn(() => { store = {}; }),
        removeItem: vi.fn((key) => { delete store[key]; }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// --------------------------------------------------------------------------
// II. CONFIGURACIÓN DEL ENTORNO DE PRUEBA
// --------------------------------------------------------------------------


beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
    server.resetHandlers(); 
    vi.clearAllMocks();    
    localStorageMock.clear(); 
});
afterAll(() => server.close());


const renderLogin = () => render(
    <BrowserRouter>
        <Login />
    </BrowserRouter>
);

// --------------------------------------------------------------------------
// III. CASOS DE PRUEBA 
// --------------------------------------------------------------------------

describe('Login Page', () => {

    
    const ingresarCredenciales = (email: string, password: string) => {
       
        fireEvent.change(screen.getByPlaceholderText(/Correo/i), {
            target: { value: email },
        });
        
        fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), {
            target: { value: password },
        });
    };

    it('1. debería renderizar el formulario correctamente', () => {
        renderLogin();
       
        expect(screen.getByText(/Iniciar Sesión/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Correo/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Contraseña/i)).toBeInTheDocument();
        expect(screen.getByText('Ingresar Datos')).toBeInTheDocument();
    });

    // ----------------------------------------------------------------------
    // Caso de éxito
    // ----------------------------------------------------------------------
    it('2. debería iniciar sesión exitosamente y redirigir al usuario', async () => {
        renderLogin();
        
        ingresarCredenciales('test@ucn.cl', 'password123');
        
        
        fireEvent.click(screen.getByText('Ingresar Datos'));

       
        await waitFor(() => {
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'access_token',
                'TOKEN_DE_PRUEBA_123',
            );
            // 2. Verifica la redirección
            expect(mockedUseNavigate).toHaveBeenCalledWith('/seleccion');
        });
    });

    // ----------------------------------------------------------------------
    // Caso límite/Error 401: Credenciales incorrectas (I.A.3)
    // ----------------------------------------------------------------------
    it('3. debería mostrar "Credenciales incorrectas" en caso de error 401', async () => {
        // Sobrescribir el mock para simular un error 401
        server.use(
            http.post('http://localhost:3000/auth/login', () => {
                return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
            }),
        );

        renderLogin();
        ingresarCredenciales('fail@ucn.cl', 'wrongpass');
        
        fireEvent.click(screen.getByText('Ingresar Datos'));

        // Esperamos que el mensaje de error aparezca en el DOM
        await waitFor(() => {
            expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
            // Verifica que NO haya habido redirección
            expect(mockedUseNavigate).not.toHaveBeenCalled();
            // Verifica que NO se haya guardado nada
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });
    });

    // ----------------------------------------------------------------------
    // Caso de excepción: Error de conexión o servidor (I.A.3)
    // ----------------------------------------------------------------------
    it('4. debería mostrar "Error de conexión" si la API no está disponible', async () => {
        // Sobrescribir el mock para simular un error de red o servidor 500
        server.use(
            http.post('http://localhost:3000/auth/login', () => {
                // MSW puede simular un error de red lanzando un error
                // o simulando un estado 500, en este caso, simulemos 500:
                return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
            }),
        );
        
        renderLogin();
        ingresarCredenciales('server@error.cl', 'anypass');
        
        fireEvent.click(screen.getByText('Ingresar Datos'));

        await waitFor(() => {
            expect(screen.getByText('Error de conexión')).toBeInTheDocument();
            // Comprueba que el error no sea 401 (Credenciales incorrectas)
            expect(screen.queryByText('Credenciales incorrectas')).not.toBeInTheDocument();
        });
    });

    // ----------------------------------------------------------------------
    // Caso de Frontera
    // ----------------------------------------------------------------------
    it('5. debería limpiar el mensaje de error si se hace clic en el botón de cerrar', async () => {

        server.use(
            http.post('http://localhost:3000/auth/login', () => {
                return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
            }),
        );

        renderLogin();
        ingresarCredenciales('fail@ucn.cl', 'wrongpass');
        
        fireEvent.click(screen.getByText('Ingresar Datos'));

    
        const errorMessage = await screen.findByText('Credenciales incorrectas');


        const closeButton = screen.getByRole('button', { name: /Cerrar/i });
        
        fireEvent.click(closeButton);

    
        expect(errorMessage).not.toBeInTheDocument();
    });

});