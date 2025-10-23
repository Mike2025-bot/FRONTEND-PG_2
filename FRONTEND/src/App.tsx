// Archivo principal de la aplicación React
// Define el enrutamiento y monta el layout general

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
//import G_Productos from './components/g_productos/G_Productos';
import './App.css';
import React from 'react';
import LoginRegistro from './components/autenticacion/LoginRegistro';
import InventarioP from './components/inventarioP/InventarioP';
import Categorias from './components/categorias/Categorias';
import EntradaDProductos from './components/entradasDP/EntradaDProductos';
import MovimientosP from './components/movimientosP/MovimientosP';
import Usuarios from './components/usuarios/Usuarios';
import Proveedores from './components/proveedores/Proveedores';
import VentasCaja from './components/ventasCaja/VentasCaja';



// Páginas adicionales (puedes expandir estas más adelante)

const Clientes = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Gestión de Clientes</h1>
    <p>Aquí podrás gestionar tu base de clientes.</p>
  </div>
);

const Reportes = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Reportes</h1>
    <p>Aquí podrás generar y ver reportes detallados.</p>
  </div>
);

const Configuracion = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Configuración</h1>
    <p>Aquí podrás configurar tu aplicación.</p>
  </div>
);

const EscanerPage = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Escáner de productos</h1>
    <button
      style={{
        padding: '1rem 2rem',
        fontSize: '1.2rem',
        borderRadius: '8px',
        background: '#667eea',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        marginTop: '2rem',
      }}
      onClick={() => alert('Aquí se activaría el escáner de código de barras')}
    >
      Iniciar escaneo
    </button>
  </div>
);

// Componente principal de la app
function App() {
  const [logueado, setLogueado] = React.useState(() => localStorage.getItem('logueado') === 'true');
  const permisosKeys = React.useMemo(() => {
    const stored = localStorage.getItem('usuario');
    const normalize = (s: string) => {
      try {
        return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/g, '');
      } catch {
        return s.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
    };
    if (!stored) return new Set<string>();
    try {
      const u = JSON.parse(stored);
      const keys = Array.isArray(u?.permisos)
        ? u.permisos.map((p: any) => {
            if (typeof p === 'string') return normalize(p);
            if (p?.nombre_modulo) return normalize(String(p.nombre_modulo));
            if (p?.ruta) return normalize(String(p.ruta).replace('/', ''));
            if (p?.clave) return normalize(String(p.clave));
            if (p?.id || p?.id_modulo) return normalize(String(p.id ?? p.id_modulo));
            return '';
          }).filter((s: string) => s)
        : [];
      const esAdmin = u?.rol && normalize(String(u.rol)).includes('admin');
      if (esAdmin || keys.length === 0) {
        // Sin restricciones: permitir todo
        return new Set<string>(['all']);
      }
      return new Set<string>(keys);
    } catch {
      return new Set<string>();
    }
  }, [logueado]);

  React.useEffect(() => {
    const onStorage = () => setLogueado(localStorage.getItem('logueado') === 'true');
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!logueado) {
    return <LoginRegistro />;
  }

  const ProtectedRoute: React.FC<{ pathKey: string; element: React.ReactElement }> = ({ pathKey, element }) => {
    // Si hay permiso global 'all', permitir; si no, comparar clave normalizada de la ruta
    if (permisosKeys.has('all')) return element;
    const normalize = (s: string) => {
      try {
        return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/g, '');
      } catch {
        return s.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
    };
    const key = normalize(pathKey);
    return permisosKeys.has(key) ? element : <Navigate to="/" replace />;
  };

  return (
    // Router envuelve toda la app para habilitar navegación
    <Router>
      {/* Layout general: Sidebar, Navbar y contenido principal */}
      <Layout>
        {/* Definición de rutas principales */}
        <Routes>
          <Route path="/" element={<ProtectedRoute pathKey="dashboard" element={<Dashboard />} />} />
          <Route path="/inventarioP" element={<ProtectedRoute pathKey="inventarioP" element={<InventarioP />} />} />
          <Route path="/categorias" element={<ProtectedRoute pathKey="categorias" element={<Categorias />} />} />
          <Route path="/clientes" element={<ProtectedRoute pathKey="clientes" element={<Clientes />} />} />
          <Route path="/reportes" element={<ProtectedRoute pathKey="reportes" element={<Reportes />} />} />
          <Route path="/configuracion" element={<ProtectedRoute pathKey="configuracion" element={<Configuracion />} />} />
          <Route path="/escaner" element={<ProtectedRoute pathKey="escaner" element={<EscanerPage />} />} />
          <Route path="/entradaDProductos" element={<ProtectedRoute pathKey="entradaDProductos" element={<EntradaDProductos />} />} />
          <Route path="/movimientosP" element={<ProtectedRoute pathKey="movimientosP" element={<MovimientosP />} />} /> 
          <Route path="/usuarios" element={<ProtectedRoute pathKey="usuarios" element={<Usuarios />} />} />
          <Route path="/proveedores" element={<ProtectedRoute pathKey="proveedores" element={<Proveedores />} />} />  
          <Route path="/ventasCaja" element={<ProtectedRoute pathKey="ventasCaja" element={<VentasCaja />} />} />         
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
