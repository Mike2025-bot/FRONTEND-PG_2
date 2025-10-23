// Componente Navbar: barra superior de navegación
// Incluye notificaciones, perfil de usuario y lógica de dropdowns

/* Navegacion global */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import API_URL from '../../config';

interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tiempo: string;
  leida: boolean;
  id_producto?: number;
  nombre_producto?: string;
  stock_actual?: number;
  stock_minimo?: number;
  stock_maximo?: number;
}

interface NavbarProps {
  mostrarNotificaciones: boolean;
  setMostrarNotificaciones: React.Dispatch<React.SetStateAction<boolean>>;
  mostrarPerfil: boolean;
  setMostrarPerfil: React.Dispatch<React.SetStateAction<boolean>>;
}

const Navbar: React.FC<NavbarProps> = ({ mostrarNotificaciones, setMostrarNotificaciones, mostrarPerfil, setMostrarPerfil }) => {
  const navigate = useNavigate();
  
  // Referencias a los dropdowns
  const notifRef = useRef<HTMLDivElement>(null);
  const perfilRef = useRef<HTMLDivElement>(null);

//-----------------------------------------------> NUEVO

  // Estados para mostrar usuario dinámico
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');
  const [rolUsuario, setRolUsuario] = useState('Rol'); // o correo si prefieres
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      try {
        const usuario = JSON.parse(storedUser);
        setNombreUsuario(usuario.nombre_usuario || 'Usuario');
        setRolUsuario(usuario.rol || 'Rol'); // o usuario.email si quieres mostrar correo
      } catch (error) {
        console.error('Error al leer usuario del localStorage:', error);
      }
    }
  }, []);

  // Cargar notificaciones de stock bajo
  const cargarNotificacionesStock = async () => {
    try {
      const response = await fetch(`${API_URL}/api/productos`);
      const productos = await response.json();
      
      // Filtrar productos sin stock (prioridad crítica)
      const productosSinStock = productos.filter((p: any) => 
        p.stock_actual <= 0
      );
      
      // Filtrar productos con stock bajo (prioridad alta)
      const productosStockBajo = productos.filter((p: any) => 
        p.stock_actual > 0 && p.stock_actual < (p.stock_minimo || 5)
      );
      
      // Filtrar productos para reponer (prioridad media)
      const productosParaReponer = productos.filter((p: any) => 
        p.stock_actual >= (p.stock_minimo || 5) && 
        p.stock_actual < (p.stock_maximo || p.stock_actual + 1) &&
        (p.stock_maximo || 0) > 0
      );

      const nuevasNotificaciones: Notificacion[] = [];

      // 1. Notificaciones de stock crítico (sin stock) - PRIORIDAD ALTA
      productosSinStock.forEach((p: any) => {
        nuevasNotificaciones.push({
          id: `sin-stock-${p.id_producto}`,
          titulo: '🚨 Sin Stock',
          mensaje: `"${p.nombre_producto}" - Stock: ${p.stock_actual}`,
          tiempo: 'Ahora',
          leida: false,
          id_producto: p.id_producto,
          nombre_producto: p.nombre_producto,
          stock_actual: p.stock_actual,
          stock_minimo: p.stock_minimo,
          stock_maximo: p.stock_maximo
        });
      });

      // 2. Notificaciones de stock bajo - PRIORIDAD ALTA
      productosStockBajo.forEach((p: any) => {
        nuevasNotificaciones.push({
          id: `stock-bajo-${p.id_producto}`,
          titulo: '⚠️ Stock Bajo',
          mensaje: `"${p.nombre_producto}" - Stock: ${p.stock_actual} (Mínimo: ${p.stock_minimo || 5})`,
          tiempo: 'Ahora',
          leida: false,
          id_producto: p.id_producto,
          nombre_producto: p.nombre_producto,
          stock_actual: p.stock_actual,
          stock_minimo: p.stock_minimo,
          stock_maximo: p.stock_maximo
        });
      });

      // 3. Notificaciones de productos para reponer - PRIORIDAD MEDIA
      productosParaReponer.forEach((p: any) => {
        const cantidadReponer = (p.stock_maximo || 0) - p.stock_actual;
        nuevasNotificaciones.push({
          id: `reponer-${p.id_producto}`,
          titulo: '📦 Para Reponer',
          mensaje: `"${p.nombre_producto}" - Stock: ${p.stock_actual} (Máximo: ${p.stock_maximo}) - Reponer: ${cantidadReponer}`,
          tiempo: 'Ahora',
          leida: false,
          id_producto: p.id_producto,
          nombre_producto: p.nombre_producto,
          stock_actual: p.stock_actual,
          stock_minimo: p.stock_minimo,
          stock_maximo: p.stock_maximo
        });
      });

      setNotificaciones(nuevasNotificaciones);
    } catch (error) {
      console.error('Error al cargar notificaciones de stock:', error);
    }
  };

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    cargarNotificacionesStock();
    
    // ⭐ Actualizar cada 30 segundos para tiempo real
    const interval = setInterval(cargarNotificacionesStock, 30 * 1000);
    
    // ⭐ Escuchar evento de actualización de stock desde otros componentes
    const handleStockActualizado = () => {
      cargarNotificacionesStock();
    };

    window.addEventListener('stockActualizado', handleStockActualizado);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('stockActualizado', handleStockActualizado);
    };
  }, []);

  //--------------------------FIN

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current && !notifRef.current.contains(event.target as Node) &&
        perfilRef.current && !perfilRef.current.contains(event.target as Node)
      ) {
        setMostrarNotificaciones(false);
        setMostrarPerfil(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setMostrarNotificaciones, setMostrarPerfil]);

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  // Marcar todas las notificaciones como leídas
  const marcarTodasComoLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    
    // Eliminar todas las notificaciones leídas después de 4 minutos
    setTimeout(() => {
      setNotificaciones(prev => prev.filter(n => !n.leida));
    }, 4 * 60 * 1000); // 4 minutos
  };

  // Marcar una notificación como leída
  const marcarComoLeida = (id: string) => {
    setNotificaciones(prev => 
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
    
    // Eliminar esta notificación específica después de 4 minutos
    setTimeout(() => {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    }, 4 * 60 * 1000); // 4 minutos
  };

  // Manejar click en notificación para ir a reponer producto
  const handleClickNotificacion = async (notif: Notificacion) => {
    // Marcar como leída
    marcarComoLeida(notif.id);
    
    // Guardar producto en localStorage para EntradaDProductos
    if (notif.id_producto && notif.nombre_producto) {
      try {
        // Obtener el producto completo desde la API para tener el precio_compra
        const response = await fetch(`https://backend-pg2-3.onrender.com/api/productos`);
        const productos = await response.json();
        const productoCompleto = productos.find((p: any) => p.id_producto === notif.id_producto);
        
        const cantidadSugerida = (notif.stock_maximo || 0) - (notif.stock_actual || 0);
        
        const productoData = {
          id_producto: notif.id_producto,
          nombre_producto: notif.nombre_producto,
          precio_compra: productoCompleto?.precio_compra || 0,
          stock_actual: notif.stock_actual || 0,
          stock_minimo: notif.stock_minimo || 0,
          stock_maximo: notif.stock_maximo || 0,
          cantidad_sugerida: cantidadSugerida > 0 ? cantidadSugerida : 1
        };
        
        localStorage.setItem('productoAReponer', JSON.stringify(productoData));
        
        // Disparar evento personalizado para que EntradaDProductos lo detecte
        window.dispatchEvent(new CustomEvent('productoAReponerActualizado', { 
          detail: productoData 
        }));
        
        // Cerrar dropdown de notificaciones
        setMostrarNotificaciones(false);
        
        // Navegar a EntradaDProductos
        navigate('/entradaDProductos');
      } catch (error) {
        console.error('Error al obtener datos del producto:', error);
        // Aún así navegar con datos básicos
        const productoDataBasico = {
          id_producto: notif.id_producto,
          nombre_producto: notif.nombre_producto,
          precio_compra: 0,
          stock_actual: notif.stock_actual || 0,
          stock_minimo: notif.stock_minimo || 0,
          stock_maximo: notif.stock_maximo || 0,
          cantidad_sugerida: (notif.stock_maximo || 0) - (notif.stock_actual || 0) || 1
        };
        
        localStorage.setItem('productoAReponer', JSON.stringify(productoDataBasico));
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('productoAReponerActualizado', { 
          detail: productoDataBasico 
        }));
        
        setMostrarNotificaciones(false);
        navigate('/entradaDProductos');
      }
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-right">
        <div className="navbar-actions">
          {/* Notificaciones */}
          <div className="notification-container" ref={notifRef}>
            <button
              className="notification-btn"
              onClick={() => {
                setMostrarNotificaciones((prev) => {
                  if (!prev) setMostrarPerfil(false);
                  return !prev;
                });
              }}
              aria-label="Notificaciones"
            >
              🔔
              {notificacionesNoLeidas > 0 && (
                <span className="notification-badge">{notificacionesNoLeidas}</span>
              )}
            </button>

            {mostrarNotificaciones && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notificaciones</h3>
                  {notificacionesNoLeidas > 0 && (
                    <button className="mark-all-read" onClick={marcarTodasComoLeidas}>
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notificacionesNoLeidas === 0 ? (
                    <div className="notification-item" style={{ textAlign: 'center', padding: '2em' }}>
                      <p style={{ color: '#6b7280' }}>No hay notificaciones nuevas</p>
                    </div>
                  ) : (
                    notificaciones
                      .filter(notif => !notif.leida) // Solo mostrar no leídas
                      .map((notif) => (
                        <div 
                          key={notif.id} 
                          className="notification-item no-leida"
                          onClick={() => handleClickNotificacion(notif)}
                          style={{ cursor: 'pointer' }}
                          title="Click para ir a reponer este producto"
                        >
                          <div className="notification-content">
                            <h4>{notif.titulo}</h4>
                            <p>{notif.mensaje}</p>
                            <span className="notification-time">{notif.tiempo}</span>
                          </div>
                          <div className="notification-dot"></div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Perfil de usuario */}
          <div className="profile-container" ref={perfilRef}>
            <button
              className="profile-btn"
              onClick={() => {
                setMostrarPerfil((prev) => {
                  if (!prev) setMostrarNotificaciones(false);
                  return !prev;
                });
              }}
              aria-label="Perfil de usuario"
            >
              <div className="profile-avatar">👤</div>
              <span className="profile-name">{nombreUsuario}</span>
              <span className="profile-arrow">▼</span>
            </button>

            {mostrarPerfil && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <div className="profile-avatar-large">👤</div>
                  <div className="profile-details">
                    <h4>{nombreUsuario}</h4>
                    <p>{rolUsuario}</p> {/* aquí puedes mostrar correo o rol */}
                  </div>
                </div>
                <div className="profile-menu">
                  <button className="profile-menu-item">
                    <span>👤</span>
                    Mi Perfil
                  </button>
                  
                  <hr />
                  <button className="profile-menu-item logout" onClick={() => {
                    try {
                      localStorage.removeItem('usuario');
                      localStorage.removeItem('logueado');
                    } catch {}
                    window.location.href = '/';
                  }}>
                    <span>🚪</span>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 