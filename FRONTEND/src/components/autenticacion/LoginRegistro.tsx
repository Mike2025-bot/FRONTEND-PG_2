import React, { useState, useEffect } from 'react';
import HasOlvidadoTuContrasena from './HasOlvidadoTuContrasena';
import './LoginRegistro.css';
import 'boxicons/css/boxicons.min.css';
import API_URL from '../../config';

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

const LoginRegistro: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<Rol[]>([]);
  const [rol, setRol] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const [showPassword, setShowPassword] = useState(false);


  // 🔹 Cargar roles desde backend
  useEffect(() => {
    fetch(`${API_URL}/api/login/roles`)
      .then(res => res.json())
      .then(data => setRoles(data))
      .catch(err => console.error('Error al cargar roles:', err));
  }, []);

  if (showForgot) {
    return (
      <HasOlvidadoTuContrasena onBackToLogin={() => setShowForgot(false)} />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!username || !password || !rol) {
    setError('Por favor completa todos los campos');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/login/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_usuario: username,
        contrasena: password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Usuario, contraseña o rol incorrectos');
      return;
    }

    // Validar rol
    if (data.rol !== rol) {
      setError('El rol seleccionado no coincide con el usuario');
      return;
    }

    // Guardar sesión
    localStorage.setItem('logueado', 'true');
    localStorage.setItem('usuario', JSON.stringify(data));
    window.location.reload(); // o redirigir a dashboard

  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    setError('Error de conexión con el servidor');
  }
};

  
  
  
  /*if (username === 'admin' && password === 'admin') {
    localStorage.setItem('logueado', 'true');
    window.location.reload();
  } else {
    setError('Usuario, contraseña o rol incorrectos');
  }
};*/



  return (
    <div className="wrapper">
      <div className="login_box">
        <form onSubmit={handleSubmit}>
          <div className="login-header">
            <span>Login</span>
          </div>

          {/* Usuario */}
          <div className="input_box">
            <input
              type="text"
              id="user"
              className="input-field"
              required
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <i className="bx bx-user icon"></i>
          </div>

          {/* Contraseña */}
          <div className="input_box password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              id="pass"
              className="input-field"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <i 
              className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} icon password-icon`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>


          {/* Combobox de roles */}
          <div className="input_box">
            <select
              className="input-field combo-rol"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              required
            >
              <option value="">Selecciona un rol</option>
              {roles.map((r) => (
                <option key={r.id_rol} value={r.nombre_rol}>
                  {r.nombre_rol}
                </option>
              ))}
            </select>
            <i className="bx bxs-user-badge icon"></i>
          </div>

      
          {/* Error */}
          {error && <div className="login-error">{error}</div>}

          {/* Botón de login */}
          <div className="input_box">
            <input type="submit" className="input-submit" value="Login" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginRegistro;
