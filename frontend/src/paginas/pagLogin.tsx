import React from 'react';
import '../style/loginStyle.css';
import logo from '../assets/logoUCN.png';
import { useNavigate } from 'react-router-dom';
import ErrorMessage from '../componentes/mensajeError';

const Login: React.FC = () => {
  // Datos Usuario
  const [correo, setCorreo] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  // Manejo de formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const url = "https://tuservidor.com/api/login";

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });

      if (!response.ok) {
        setError('Credenciales incorrectas');
        return;
      }

      const data = await response.json();
      console.log('Login exitoso:', data);
      navigate('/malla');
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
            value={correo}
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

        {error && <ErrorMessage message={error} />}
      </div>
    </div>
  );
};

export default Login;