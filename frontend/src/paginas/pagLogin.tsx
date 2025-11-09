import React from 'react';
import '../style/styleLogin.css';
import logo from '../assets/logoUCN.png';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import ErrorMessage from '../componentes/compMensajeError';

const Login: React.FC = () => {
  // Datos Usuario
  const [email, setCorreo] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Inicio — Proyéctate UCN";
  }, []);

  // Manejo de formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const url = "http://localhost:3000/auth/login";

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        setError('Credenciales incorrectas');
        return;
      }

      const data = await response.json();

      localStorage.setItem('access_token', data.access_token);
      console.log('Login exitoso:', data);
      navigate('/seleccion');
    } catch (err) {
      setError('Error de conexión');
    }
  };

  return (
    <div className="cuerpoLogin">
      <img src={logo} alt="Logo UCN" className="logo" />
      <h3>Bienvenid@ a Proyectate UCN</h3>

      <div className="login-box">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Ingresar Datos</button>
        </form>

        {error && <ErrorMessage message={error} onClose={() => setError(null)}/>}
      </div>
    </div>
  );
};

export default Login;