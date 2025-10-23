// Componente Layout: estructura principal de la app
// Organiza Sidebar, Navbar y el contenido principal
import { useState, useEffect } from 'react';
import Sidebar, { SIDEBAR_MOBILE_WIDTH, SIDEBAR_MOBILE_WIDTH_EXPANDED } from './Sidebar';
import Navbar from './Navbar';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  // Leer el estado inicial del Sidebar desde localStorage
  const [sidebarColapsado, setSidebarColapsado] = useState(() => {
    const saved = localStorage.getItem('sidebarColapsado');
    return saved ? JSON.parse(saved) : false;
  });

  // Hook para detectar móvil (igual que en Sidebar)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  // Estado del Sidebar móvil (colapsado/expandido)
  const [mobileCollapsed, setMobileCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarMobileCollapsed');
    return saved ? JSON.parse(saved) : true;
  });

  // Guardar el estado en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('sidebarColapsado', JSON.stringify(sidebarColapsado));
  }, [sidebarColapsado]);
  useEffect(() => {
    localStorage.setItem('sidebarMobileCollapsed', JSON.stringify(mobileCollapsed));
  }, [mobileCollapsed]);

  // Estado global para dropdowns del Navbar
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);

  // Pasar el estado y setter al Sidebar
  const toggleSidebar = () => {
    setSidebarColapsado((prev: boolean) => !prev);
    setMobileCollapsed((v: boolean) => !v);
  };

  // Cerrar los dropdowns del Navbar
  const cerrarDropdownsNavbar = () => {
    setMostrarNotificaciones(false);
    setMostrarPerfil(false);
  };

  // Calcular el margen izquierdo dinámico
  let marginLeft = sidebarColapsado ? 70 : 280;
  if (isMobile) {
    marginLeft = mobileCollapsed ? SIDEBAR_MOBILE_WIDTH : SIDEBAR_MOBILE_WIDTH_EXPANDED;
  }

  return (
    <div className="layout">
      <Sidebar 
        colapsado={sidebarColapsado}
        onToggle={toggleSidebar}
        mobileCollapsed={mobileCollapsed}
        setMobileCollapsed={setMobileCollapsed}
        cerrarDropdownsNavbar={cerrarDropdownsNavbar}
      />
      <div
        className={`layout-main ${sidebarColapsado ? 'sidebar-colapsado' : ''}`}
        style={{ marginLeft }}
      >
        <Navbar 
          mostrarNotificaciones={mostrarNotificaciones}
          setMostrarNotificaciones={setMostrarNotificaciones}
          mostrarPerfil={mostrarPerfil}
          setMostrarPerfil={setMostrarPerfil}
        />
        <main className="layout-content">
          {children}
        </main>
      </div>
      {/* Overlay para móvil */}
      {sidebarColapsado && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarColapsado(false)}
        />
      )}
    </div>
  );
};

export default Layout; 