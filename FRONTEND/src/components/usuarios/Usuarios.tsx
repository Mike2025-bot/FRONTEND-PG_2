import { useState, useEffect } from "react";
import "./Usuarios.css";
import axios from "axios";
import 'boxicons/css/boxicons.min.css';
import API_URL from "../../config";

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

interface Usuario {
  id_usuario?: number;
  nombre_usuario: string;
  contrasena: string;
  id_rol: number;
  nombre_rol?: string; // ✅ 
}

const Usuarios = () => {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  const [modulos, setModulos] = useState<any[]>([]);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState<number[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState<number | null>(null);
  
  // Estado para almacenar contraseñas sin encriptar temporalmente
  const [contraseñasReales, setContraseñasReales] = useState<{[key: number]: string}>({});
  
  // Estado para mostrar si el nombre de usuario está disponible
  const [nombreUsuarioDisponible, setNombreUsuarioDisponible] = useState<boolean | null>(null);
  
  // Estado para mostrar/ocultar contraseña
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [formulario, setFormulario] = useState<Usuario>({
    nombre_usuario: "",
    contrasena: "",
    id_rol: 0,
  });

  // Cargar roles y usuarios al iniciar
  useEffect(() => {
    cargarRoles();
    cargarUsuarios();
  }, []);

  const cargarRoles = async () => {
    try {
      setCargando(true);
      const res = await fetch(`${API_URL}/api/login/roles`);
      const data = await res.json();
      setRoles(data);
    } catch (error) {
      console.error("Error al cargar roles:", error);
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      //const res = await fetch(`${API_URL}/api/usuarios`);
      const res = await fetch(`${API_URL}/api/login`);
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setCargando(false);
    }
  };

  const limpiarFormulario = () => {
    setFormulario({ nombre_usuario: "", contrasena: "", id_rol: 0 });
    setNombreUsuarioDisponible(null);
    setUsuarioSeleccionado(null);
    setRolSeleccionado(null);
  };

  // Función para verificar disponibilidad del nombre de usuario
  const verificarDisponibilidadUsuario = (nombre: string) => {
    if (!nombre.trim()) {
      setNombreUsuarioDisponible(null);
      return;
    }

    const usuarioExistente = usuarios.find(
      u => u.nombre_usuario.toLowerCase() === nombre.toLowerCase()
    );

    setNombreUsuarioDisponible(!usuarioExistente);
  };

  // Función para limpiar contraseñas temporales (opcional - por seguridad)
  const limpiarContraseñasTemporales = () => {
    setContraseñasReales({});
  };

  


  // Función unificada para eliminar usuario o rol
  const eliminar = async () => {
    // Prioridad: Si hay un usuario seleccionado, eliminar usuario
    if (usuarioSeleccionado) {
      const confirmacion = window.confirm(
        `¿Estás seguro de que quieres eliminar al usuario "${formulario.nombre_usuario}"?`
      );

      if (!confirmacion) return;

      try {
        const response = await fetch(`${API_URL}/api/login/${usuarioSeleccionado}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("✅ Usuario eliminado correctamente");
          
          // Limpiar contraseña temporal si existe
          setContraseñasReales(prev => {
            const nuevas = { ...prev };
            delete nuevas[usuarioSeleccionado];
            return nuevas;
          });
          
          limpiarFormulario();
          cargarUsuarios();
        } else {
          const err = await response.json();
          alert(`❌ Error: ${err.error}`);
        }
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        alert("❌ Error de conexión con el servidor");
      }
      return;
    }

    // Si no hay usuario seleccionado, verificar si hay un rol seleccionado
    if (rolSeleccionado) {
      const rol = roles.find(r => r.id_rol === rolSeleccionado);
      if (!rol) return;

      // Verificar si hay usuarios con este rol
      const usuariosConRol = usuarios.filter(u => u.id_rol === rolSeleccionado);
      
      if (usuariosConRol.length > 0) {
        alert(`⚠️ No se puede eliminar el rol "${rol.nombre_rol}" porque tiene ${usuariosConRol.length} usuario(s) asignado(s).\n\nPrimero debes reasignar o eliminar esos usuarios.`);
        return;
      }

      const confirmacion = window.confirm(
        `¿Estás seguro de que quieres eliminar el rol "${rol.nombre_rol}"?`
      );

      if (!confirmacion) return;

      try {
        const response = await fetch(`${API_URL}/api/login/roles/${rolSeleccionado}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("✅ Rol eliminado correctamente");
          limpiarFormulario();
          cargarRoles();
        } else {
          const err = await response.json();
          alert(`❌ Error: ${err.error}`);
        }
      } catch (error) {
        console.error("Error al eliminar rol:", error);
        alert("❌ Error de conexión con el servidor");
      }
      return;
    }

    // Si no hay nada seleccionado
    alert("⚠️ Selecciona un usuario de la tabla o un rol del combobox para eliminar");
  };

  const guardarRol = async () => {
    const nombreRol = prompt("Ingrese el nombre del nuevo rol:");
    if (!nombreRol) return;

    try {
      const response = await fetch(`${API_URL}/api/login/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_rol: nombreRol }),
      });

      if (response.ok) {
        alert("Rol creado correctamente");
        cargarRoles();
      } else {
        const err = await response.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Error al crear rol:", error);
      alert("Error de conexión con el servidor");
    }
  };

  const guardarUsuario = async () => {
    if (!formulario.nombre_usuario || !formulario.contrasena || formulario.id_rol === 0) {
      alert("Todos los campos son obligatorios");
      return;
    }

    // Solo verificar si NO estamos editando un usuario existente
    if (!usuarioSeleccionado) {
      const usuarioExistente = usuarios.find(
        u => u.nombre_usuario.toLowerCase() === formulario.nombre_usuario.toLowerCase()
      );

      if (usuarioExistente) {
        alert(`El usuario "${formulario.nombre_usuario}" ya existe. Por favor, elige otro nombre de usuario.`);
        return;
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/login/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_usuario: formulario.nombre_usuario,
          contrasena: formulario.contrasena,
          id_rol: formulario.id_rol,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Usuario creado correctamente ✅");
        
        // Almacenar la contraseña real temporalmente para mostrar en la tabla
        if (data.id_usuario) {
          setContraseñasReales(prev => ({
            ...prev,
            [data.id_usuario]: formulario.contrasena
          }));
        }
        
        limpiarFormulario();
        setUsuarioSeleccionado(null);
        cargarUsuarios(); // refresca la lista
      } else {
        const err = await response.json();
        alert(`Error al crear usuario: ${err.error}`);
      }
    } catch (error) {
      console.error("Error al crear usuario:", error);
      alert("Error de conexión con el servidor. Verifica que el backend esté ejecutándose.");
    }
  };


  const usuariosFiltrados = usuarios.filter((u) =>
    u.nombre_usuario.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ---------------------------------------------------------------------NUEVO

  // 🔹 Cargar módulos
  useEffect(() => {
    axios.get(`${API_URL}/api/login/modulos`)
      .then(res => setModulos(res.data))
      .catch(err => console.error(err));
  }, []);

  // 🔹 Cargar permisos cuando se seleccione un usuario
  useEffect(() => {
    if (usuarioSeleccionado) {
      axios.get(`${API_URL}/api/login/permisos/${usuarioSeleccionado}`)
        .then(res => {
          const ids = res.data.map((p: any) => p.id_modulo);
          setPermisosSeleccionados(ids);
        })
        .catch(err => console.error(err));
    }
  }, [usuarioSeleccionado]);

  // 🔹 Alternar selección de permisos
  const togglePermiso = (id_modulo: number) => {
    if (permisosSeleccionados.includes(id_modulo)) {
      setPermisosSeleccionados(permisosSeleccionados.filter(id => id !== id_modulo));
    } else {
      setPermisosSeleccionados([...permisosSeleccionados, id_modulo]);
    }
  };

  // 🔹 Guardar permisos seleccionados
  const guardarPermisos = async () => {
    if (!usuarioSeleccionado) {
      alert("Selecciona un usuario primero");
      return;
    }
    try {
      await axios.post(`${API_URL}/api/login/permisos/asignar`, {
        id_usuario: usuarioSeleccionado,
        modulos: permisosSeleccionados,
      });
      alert("Permisos actualizados correctamente ✅");
    } catch (error) {
      console.error(error);
      alert("Error al guardar los permisos ❌");
    }
  };

  // ---------------------------------------------------------------------FIN

  return (
    <div className="usuarios-container">
      {/* Header */}
      <div className="usuarios-header">
        <h1>🧑🏻‍🤝‍🧑🏾GESTIÓN DE USUARIOS Y ROLES</h1>
        <div className="header-buttons">
        </div>
      </div>

      <div className="usuarios-content">
        {/* Panel izquierdo: Lista de usuarios */}
        <div className="panel-izquierdo1">
          <div className="busqueda-container">
            <input
              type="text"
              placeholder="🔍 Buscar usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-busqueda"
            />
            <button onClick={() => setBusqueda("")} className="btn-limpiarr">×</button>
            <button onClick={guardarRol} className="btn-agregar-rol">
              + Crear Rol
            </button>
            <button onClick={limpiarContraseñasTemporales} className="btn-limpiar-contrasenas" title="Limpiar contraseñas temporales por seguridad">
              🔒 Limpiar Contraseñas
            </button>
          </div>

          <div className="tabla-usuarios">
  {cargando ? (
    <p>Cargando...</p>
  ) : usuariosFiltrados.length === 0 ? (
    <p>No hay usuarios registrados</p>
  ) : (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre de Usuario</th>
          <th>Contraseña</th>
          <th>Rol</th>
        </tr>
      </thead>
      <tbody>
        {usuariosFiltrados.map((u) => (
          <tr
            key={u.id_usuario}
            className={usuarioSeleccionado === u.id_usuario ? "seleccionado" : ""}
            onClick={() => {
              setFormulario({
                nombre_usuario: u.nombre_usuario,
                contrasena: contraseñasReales[u.id_usuario!] || u.contrasena,
                id_rol: u.id_rol,
              });
              setUsuarioSeleccionado(u.id_usuario ?? null);
              setRolSeleccionado(null); // Limpiar rol seleccionado
            }}
          >
            <td>{u.id_usuario}</td>
            <td>{u.nombre_usuario}</td>
            <td>
              {contraseñasReales[u.id_usuario!] || "••••••••"}
            </td>
            <td>
              {roles.find((r) => r.id_rol === u.id_rol)?.nombre_rol || "N/A"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

        </div>

        {/* Panel derecho: Formulario */}
        <div className="panel-derecho2">
          <div className="formulario">
            <label>Nombre de usuario</label>
            <input
              type="text"
              value={formulario.nombre_usuario}
              onChange={(e) => {
                setFormulario({ ...formulario, nombre_usuario: e.target.value });
                verificarDisponibilidadUsuario(e.target.value);
              }}
              className={nombreUsuarioDisponible === false ? 'input-error' : nombreUsuarioDisponible === true ? 'input-success' : ''}
            />
            {nombreUsuarioDisponible === false && (
              <span className="error-message">❌ Este nombre de usuario ya existe</span>
            )}
            {nombreUsuarioDisponible === true && (
              <span className="success-message">✅ Nombre de usuario disponible</span>
            )}

            <label>Contraseña</label>
            <div className="password-input-container">
              <input
                type={mostrarContrasena ? "text" : "password"}
                value={formulario.contrasena}
                onChange={(e) => setFormulario({ ...formulario, contrasena: e.target.value })}
                className="password-input"
              />
              <i 
                className={`bx ${mostrarContrasena ? 'bx-show' : 'bx-hide'} password-toggle-icon`}
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                title={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
              ></i>
            </div>

            <label>Rol</label>
            <select
              value={formulario.id_rol}
              onChange={(e) => {
                const idRol = Number(e.target.value);
                setFormulario({ ...formulario, id_rol: idRol });
                
                // Si se selecciona un rol (no la opción por defecto), activar rolSeleccionado
                if (idRol !== 0) {
                  setRolSeleccionado(idRol);
                  setUsuarioSeleccionado(null); // Limpiar usuario seleccionado
                } else {
                  setRolSeleccionado(null);
                }
              }}
            >
              <option value={0}>-- Selecciona un rol --</option>
              {roles.map((r) => (
                <option key={r.id_rol} value={r.id_rol}>
                  {r.nombre_rol}
                </option>
              ))}
            </select>

            {/* Indicador de qué se va a eliminar */}
            {(usuarioSeleccionado || rolSeleccionado) && (
              <div className="indicador-eliminacion">
                {usuarioSeleccionado ? (
                  <span>🗑️ Se eliminará el usuario: <strong>{formulario.nombre_usuario}</strong></span>
                ) : rolSeleccionado ? (
                  <span>🗑️ Se eliminará el rol: <strong>{roles.find(r => r.id_rol === rolSeleccionado)?.nombre_rol}</strong></span>
                ) : null}
              </div>
            )}

            <button onClick={guardarUsuario} className="btn-guardar">
              Guardar
            </button>
            <button onClick={eliminar} className="btn-eliminar">
              Eliminar
            </button>
            <button onClick={limpiarFormulario} className="btn-limpiar">
              Limpiar
            </button>
          </div>


       {/* Bloque de permisos de módulos */}
<div className="permisos-container">
  <h3>🔐 Permisos de módulos</h3>
  <div className="permisos-grid">
    {modulos.map((m) => (
      <div key={m.id_modulo} className="permiso-item">
        <label className="permiso-label">
          <input
            type="checkbox"
            className="permiso-checkbox"
            checked={permisosSeleccionados.includes(m.id_modulo)}
            onChange={() => togglePermiso(m.id_modulo)}
          />
          <span className="permiso-text">{m.nombre_modulo}</span>
        </label>
      </div>
    ))}
  </div>
  <button onClick={guardarPermisos} className="btn-guardar-permisos">
    💾 Guardar Permisos
  </button>
</div>



        </div>
      </div>
    </div>
  );
};

export default Usuarios;
