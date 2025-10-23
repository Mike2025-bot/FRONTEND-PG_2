// Componente Sidebar: menú lateral de navegación
// Soporta modo colapsado, responsivo y cambio de tema

/* Menu lateral */
import { Link, useLocation } from 'react-router-dom';
import ToggleDarkMode from '../ui/ToggleDarkMode';
import './Sidebar.css';
import { useEffect, useState, useRef } from 'react';

interface MenuItem {
  id: string;
  titulo: string;
  icono: string;
  ruta: string;
}

interface SidebarProps {
  colapsado: boolean;
  onToggle: () => void;
  mobileCollapsed: boolean;
  setMobileCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  cerrarDropdownsNavbar: () => void;
}

// Hook para detectar si es móvil
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}

export const SIDEBAR_MOBILE_WIDTH = 56;
export const SIDEBAR_MOBILE_WIDTH_EXPANDED = 220;

const Sidebar = ({ colapsado, onToggle, mobileCollapsed, setMobileCollapsed, cerrarDropdownsNavbar }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  // Detectar modo oscuro por la clase en el body
  const [darkMode, setDarkMode] = useState(false);
  // Estado para mostrar/ocultar el modal de escaneo
  const [showScanModal, setShowScanModal] = useState(false);
  // Estado para el valor escaneado
  const [barcode, setBarcode] = useState('');
  // Referencia al input para autofocus
  const inputRef = useRef<HTMLInputElement>(null);

  //------------> NUEVO

  const [nombreUsuario, setNombreUsuario] = useState('Usuario');
  const [rolUsuario, setRolUsuario] = useState('Rol');
  const [permisosUsuario, setPermisosUsuario] = useState<string[]>([]);
  const [nombreNegocio, setNombreNegocio] = useState(
    localStorage.getItem('nombreNegocio') || 'SOWIN'
  );

  // Normaliza claves: minúsculas, sin acentos, sin espacios/ símbolos
  const normalizeKey = (value: string) => {
    try {
      return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]/g, '');
    } catch {
      return value.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      try {
        const usuario = JSON.parse(storedUser);
        setNombreUsuario(usuario.nombre_usuario || 'Usuario');
        setRolUsuario(usuario.rol || 'Rol');

        // Guardamos claves de permisos normalizadas para evitar problemas de acentos/formatos
        if (usuario.permisos && Array.isArray(usuario.permisos)) {
          const claves = usuario.permisos.map((p: any) => {
            if (typeof p === 'string') return normalizeKey(p);
            if (p?.nombre_modulo) return normalizeKey(String(p.nombre_modulo));
            if (p?.ruta) return normalizeKey(String(p.ruta));
            if (p?.clave) return normalizeKey(String(p.clave));
            if (p?.id || p?.id_modulo) return normalizeKey(String(p.id ?? p.id_modulo));
            return '';
          }).filter((s: string) => s.length > 0);
          setPermisosUsuario(claves);
        }
      } catch (error) {
        console.error('Error al leer usuario del localStorage:', error);
      }
    }
  }, []);





  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      try {
        const usuario = JSON.parse(storedUser);
        // Ajusta los nombres de las propiedades según lo que devuelve tu backend
        setNombreUsuario(usuario.nombre_usuario || 'Usuario');
        setRolUsuario(usuario.rol || 'Rol');
      } catch (error) {
        console.error('Error al leer usuario del localStorage:', error);
      }
    }
  }, []);




  //------------> FIN...

  // Escuchar cambios en el nombre del negocio desde localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const nuevoNombre = localStorage.getItem('nombreNegocio') || 'SOWIN';
      setNombreNegocio(nuevoNombre);
    };

    // Escuchar evento storage (cuando cambia desde otra pestaña)
    window.addEventListener('storage', handleStorageChange);

    // Escuchar evento personalizado (cuando cambia en la misma pestaña)
    window.addEventListener('nombreNegocioActualizado', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('nombreNegocioActualizado', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    setDarkMode(document.body.classList.contains('dark-mode'));
    const observer = new MutationObserver(() => {
      setDarkMode(document.body.classList.contains('dark-mode'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (showScanModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showScanModal]);

  // Función para manejar el escaneo
  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes buscar el producto automáticamente con el código escaneado
    // Por ahora solo mostramos el código en consola
    console.log('Código escaneado:', barcode);
    setBarcode('');
    setShowScanModal(false);
  };

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      titulo: "DASHBOARD",
      icono: "📊",
      ruta: "/",
    },
    {
      id: "categorias",
      titulo: "CATEGORÍAS",
      icono: "🏷️",
      ruta: "/categorias",
    },
    {
      id: "inventarioP",
      titulo: "INVENTARIO",
      icono: "📦",
      ruta: "/inventarioP",
    },
    {
      id: "entradaDProductos",
      titulo: "ENTRADA/PRODUCTOS",
      icono: "🛒",
      ruta: "/entradaDProductos",
    },
    {
      id: "movimientosP",
      titulo: "MOVIMIENTOS",
      icono: "🔄",
      ruta: "/movimientosP",
    },
    {
      id: "ventascaja",
      titulo: "VENTAS CAJA",
      icono: "💰",
      ruta: "/ventasCaja",
    },
    {
      id: "proveedores",
      titulo: "PROVEEDORES",
      icono: "🚚",
      ruta: "/proveedores",
    },
    {
      id: "usuarios",
      titulo: "USUARIOS",
      icono: "🧑🏻‍🤝‍🧑🏾",
      ruta: "/usuarios",
    },
    /*{
      id: "reportes",
      titulo: "Reportes",
      icono: "📈",
      ruta: "/reportes",
    },*/
  ];

  // 🔹 Filtramos el menú según los permisos del usuario
  const esAdmin = normalizeKey(rolUsuario).includes('admin');
  const menuFiltrado = (esAdmin || permisosUsuario.length === 0)
    ? menuItems
    : menuItems.filter(item => {
      const tituloKey = normalizeKey(item.titulo);
      const idKey = normalizeKey(item.id);
      const rutaKey = normalizeKey(item.ruta.replace('/', ''));
      return permisosUsuario.some(pk => pk === tituloKey || pk === idKey || pk === rutaKey);
    });

  // Elimino el scanMenuItem y menuItemsWithScan, y uso solo menuItems

  // Type guard para distinguir entre ítems de menú normales y el botón de escaneo
  /*function isMenuItem(item: any): item is MenuItem {
    return typeof item.ruta === 'string';
  }*/

  // --- SIDEBAR RAIL EN MÓVIL ---
  if (isMobile) {
    const sidebarWidth = mobileCollapsed ? SIDEBAR_MOBILE_WIDTH : SIDEBAR_MOBILE_WIDTH_EXPANDED;
    return (
      <>
        {/* Modal de escaneo de código de barras */}
        {showScanModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.35)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              background: darkMode ? '#232a36' : '#fff',
              color: darkMode ? '#fff' : '#232a36',
              borderRadius: 16,
              boxShadow: '0 4px 32px #0008',
              padding: 32,
              minWidth: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}>
              <h2 style={{ marginBottom: 16 }}>Escanear producto</h2>
              <form onSubmit={handleScan} style={{ width: '100%' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  placeholder="Escanea o ingresa el código de barras"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: 18,
                    borderRadius: 8,
                    border: '1.5px solid #667eea',
                    marginBottom: 24,
                    outline: 'none',
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    background: '#667eea',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 18,
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: 8,
                  }}
                >Buscar producto</button>
              </form>
              <button
                onClick={() => setShowScanModal(false)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 16,
                  background: 'none',
                  border: 'none',
                  color: darkMode ? '#fff' : '#232a36',
                  fontSize: 28,
                  cursor: 'pointer',
                }}
                aria-label="Cerrar modal"
              >×</button>
            </div>
          </div>
        )}
        <div
          className={`sidebar sidebar-rail${mobileCollapsed ? ' collapsed' : ' expanded'}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: sidebarWidth,
            height: '100vh',
            background: darkMode
              ? 'linear-gradient(135deg, #232a36 0%, #232a36 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '2px 0 16px #0002',
            zIndex: 2100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'width 0.3s cubic-bezier(.77,0,.18,1)',
          }}
        >
          {/* Botón circular con flecha SVG, elegante y centrado */}
          <button
            className="sidebar-toggle-circle"
            onClick={() => setMobileCollapsed((v) => !v)}
            aria-label={mobileCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            style={{
              margin: '12px auto',
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'transparent',
              border: '2px solid #fff',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              boxShadow: '0 2px 8px #0002',
              transition: 'background 0.2s, border 0.2s',
            }}
          >
            {mobileCollapsed ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          {/* Botón de colapsar/expandir Sidebar */}
          <nav className="sidebar-nav" style={{ width: '100%' }}>
            <ul className="menu-list" style={{ padding: 0, margin: 0, width: '100%' }}>
              <ul className="menu-list" style={{ padding: 0, margin: 0, width: '100%' }}>
                {menuFiltrado.map((item) => (
                  <li key={item.id} className="menu-item" style={{ width: '100%' }}>
                    <Link
                      to={item.ruta}
                      className={`menu-link ${location.pathname === item.ruta ? 'activo' : ''}`}
                      title={item.titulo}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 8px',
                        width: '100%',
                        justifyContent: mobileCollapsed ? 'center' : 'flex-start',
                        transition: 'background 0.2s',
                      }}
                      onClick={() => { setMobileCollapsed(true); cerrarDropdownsNavbar(); }}
                      onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#232a36' : 'rgba(102, 126, 234, 0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span className="menu-icon" style={{ fontSize: 24 }}>{item.icono}</span>
                      {!mobileCollapsed && (
                        <span className="menu-text" style={{ marginLeft: 16, fontSize: 16 }}>{item.titulo}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

            </ul>
          </nav>
          {/* Footer fijo abajo */}
          <div style={{ marginTop: 'auto', width: '100%', paddingBottom: 16 }}>
            <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="user-info" style={{ marginBottom: 8 }}>
                <div className="user-avatar">👤</div>
                {!mobileCollapsed && (
                  <div className="user-details">
                    <span className="user-name">{nombreUsuario}</span>
                    <span className="user-role">{rolUsuario}</span>
                  </div>
                )}
              </div>
              <div className="sidebar-darkmode-toggle">
                <ToggleDarkMode variant="circle" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- SIDEBAR FIJO EN ESCRITORIO ---
  return (
    <div className={`sidebar ${colapsado ? 'colapsado' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          {!colapsado && <span className="logo-text">{nombreNegocio}</span>}
        </div>
        <button
          className="toggle-btn"
          onClick={onToggle}
          aria-label="Alternar sidebar"
        >
          {colapsado ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="menu-list">
          {menuFiltrado.map((item) => (
            <li key={item.id} className="menu-item">
              <Link
                to={item.ruta}
                className={`menu-link ${location.pathname === item.ruta ? 'activo' : ''}`}
                title={colapsado ? item.titulo : ''}
              >
                <span className="menu-icon">{item.icono}</span>
                {!colapsado && <span className="menu-text">{item.titulo}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          {colapsado ? (
            <div className="user-avatar">👤</div>
          ) : (
            <>
              <div className="user-avatar">👤</div>
              <div className="user-details">
                <span className="user-name">{nombreUsuario}</span>
                <span className="user-role">{rolUsuario}</span>
              </div>
            </>
          )}
        </div>
        <div className={`sidebar-darkmode-toggle${colapsado ? ' colapsado' : ''}`}>
          <ToggleDarkMode variant={colapsado ? 'circle' : 'default'} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 