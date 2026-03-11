import React from 'react';
import '../style/styleLogin.css';
import logo from '../assets/logoUCN.png';
import axios from 'axios';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/auth/login', {
        email,
        password
      });

      const { access_token, isAdmin, role } = response.data;

      localStorage.setItem("access_token", access_token);
      
      // Redirigir según el tipo de usuario
      if (isAdmin || role === 'admin') {
        navigate("/estadisticas");
      } else {
        navigate("/seleccion");
      }

    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Credenciales incorrectas");
      } else {
        setError("Error de conexión");
      }
    }
  };

  return (
    <div className="cuerpoLogin">
      <img src={logo} alt="Logo oficial de la Universidad Católica del Norte" className="logo-ucn" />
      <h3 id="login-title">Bienvenid@ a Proyectate UCN</h3>

      <div className="login-box" role="form" aria-labelledby="login-title">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email-input" className="sr-only">Correo</label>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <label htmlFor="password-input" className="sr-only">Contraseña</label>
          <input 
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-button" aria-label="Ingresar al sistema">Ingresar Datos</button>
        </form>

        {error && <ErrorMessage message={error} onClose={() => setError(null)}/>}
      </div>
    </div>
  );
};

export default Login;