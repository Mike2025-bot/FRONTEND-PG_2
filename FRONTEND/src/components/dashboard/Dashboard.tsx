import { useState, useEffect } from 'react';
import './Dashboard.css';
import API_URL from '../../config';

interface Estadistica {
  id: string;
  titulo: string;
  valor: string;
  cambio: string;
  porcentaje: number;
  icono: string;
  color: string;
}

interface ProductoReciente {
  id: number;
  nombre: string;
  precio: string;
  stock: number;
  categoria: string;
}

interface ActividadReciente {
  id: string | number;
  accion: string;
  tiempo: string;
  tipo: string;
}

interface VentaDia {
  dia: string;
  total: number;
}

const Dashboard = () => {
  const [ventasTotales, setVentasTotales] = useState<number>(0);
  const [totalVentas, setTotalVentas] = useState<number>(0);
  const [totalProductos, setTotalProductos] = useState<number>(0);
  const [stockTotal, setStockTotal] = useState<number>(0);
  const [productosStockBajo, setProductosStockBajo] = useState<number>(0);
  const [productoTop, setProductoTop] = useState<string>('');
  const [ventasProductoTop, setVentasProductoTop] = useState<number>(0);
  const [productosRecientes, setProductosRecientes] = useState<ProductoReciente[]>([]);
  const [actividadesRecientes, setActividadesRecientes] = useState<ActividadReciente[]>([]);
  const [ventasPorDia, setVentasPorDia] = useState<VentaDia[]>([]);
  const [periodoGrafico, setPeriodoGrafico] = useState<7 | 30 | 90>(7);
  const [cargando, setCargando] = useState<boolean>(true);

  // Cargar productos desde la API
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetch(`${API_URL}/api/productos`);
        const productos = await response.json();
        
        // Calcular total de productos y stock total
        const stock = productos.reduce((sum: number, producto: any) => {
          return sum + (producto.stock_actual || 0);
        }, 0);
        
        // Calcular productos con stock bajo
        const stockBajo = productos.filter((producto: any) => 
          (producto.stock_actual || 0) <= (producto.stock_minimo || 0)
        ).length;
        
        // Obtener los 5 productos más recientes
        const recientes = productos
          .sort((a: any, b: any) => b.id_producto - a.id_producto)
          .slice(0, 5)
          .map((p: any) => ({
            id: p.id_producto,
            nombre: p.nombre_producto,
            precio: `Q${parseFloat(p.precio_venta || 0).toFixed(2)}`,
            stock: p.stock_actual || 0,
            categoria: p.nombre_categoria || 'Sin categoría'
          }));
        
        setTotalProductos(productos.length);
        setStockTotal(stock);
        setProductosStockBajo(stockBajo);
        setProductosRecientes(recientes);
      } catch (error) {
        console.error('❌ Error al cargar productos:', error);
      }
    };

    cargarProductos();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarProductos, 30000);
    
    // ⭐ Escuchar evento de actualización de stock
    const handleStockActualizado = () => {
      cargarProductos();
    };

    window.addEventListener('stockActualizado', handleStockActualizado);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('stockActualizado', handleStockActualizado);
    };
  }, []);

  // Cargar actividades recientes (entradas y ventas)
  useEffect(() => {
    const cargarActividades = async () => {
      try {
        // Cargar ventas
        const responseVentas = await fetch(`${API_URL}/api/ventas`);
        const ventas = await responseVentas.json();
        
        // Cargar entradas
        const responseEntradas = await fetch(`${API_URL}/api/entradas`);
        const entradas = await responseEntradas.json();
        
        // Combinar y formatear actividades
        const actividades: ActividadReciente[] = [];
        
        // Agregar ventas
        ventas.slice(0, 3).forEach((venta: any, index: number) => {
          actividades.push({
            id: `venta-${venta.id_venta || index}`,
            accion: `Venta registrada - Q${parseFloat(venta.total || 0).toFixed(2)}`,
            tiempo: calcularTiempo(venta.fecha),
            tipo: 'venta'
          });
        });
        
        // Agregar entradas
        entradas.slice(0, 2).forEach((entrada: any, index: number) => {
          actividades.push({
            id: `entrada-${entrada.id_entrada || index}`,
            accion: `Entrada de producto - ${entrada.cantidad} unidades`,
            tiempo: calcularTiempo(entrada.fecha),
            tipo: 'inventario'
          });
        });
        
        // Ordenar por fecha más reciente
        setActividadesRecientes(actividades.slice(0, 5));
      } catch (error) {
        console.error('Error al cargar actividades:', error);
      }
    };

    cargarActividades();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarActividades, 30000);
    
    // Escuchar evento de actualización
    const handleStockActualizado = () => {
      cargarActividades();
    };

    window.addEventListener('stockActualizado', handleStockActualizado);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('stockActualizado', handleStockActualizado);
    };
  }, []);

  // Función para calcular tiempo relativo
  const calcularTiempo = (fecha: string): string => {
    const ahora = new Date();
    const fechaActividad = new Date(fecha);
    const diferencia = ahora.getTime() - fechaActividad.getTime();
    
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);
    
    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
  };

  // Cargar ventas totales desde la API
  useEffect(() => {
    const cargarVentas = async () => {
      try {
        setCargando(true);
        const response = await fetch(`${API_URL}/api/ventas`);
        const ventas = await response.json();
        
        // Calcular total de ventas
        const total = ventas.reduce((sum: number, venta: any) => {
          return sum + parseFloat(venta.total || 0);
        }, 0);
        
        setVentasTotales(total);
        setTotalVentas(ventas.length);
        
        // Calcular producto más vendido
        const productosVendidos: { [key: string]: { nombre: string, cantidad: number } } = {};
        
        // Cargar detalles de salidas (ventas) desde la API
        const responseDetalles = await fetch(`${API_URL}/api/salidas/detalle-salidas`);
        const detallesVentas = await responseDetalles.json();
        
        // Agrupar por producto
        detallesVentas.forEach((detalle: any) => {
          const idProducto = detalle.id_producto;
          const nombreProducto = detalle.nombre_producto || 'Producto';
          const cantidad = parseInt(detalle.cantidad || 0);
          
          if (!productosVendidos[idProducto]) {
            productosVendidos[idProducto] = { nombre: nombreProducto, cantidad: 0 };
          }
          productosVendidos[idProducto].cantidad += cantidad;
        });
        
        // Encontrar el producto con más ventas
        let maxVentas = 0;
        let nombreTop = 'Sin ventas';
        
        Object.values(productosVendidos).forEach((producto) => {
          if (producto.cantidad > maxVentas) {
            maxVentas = producto.cantidad;
            nombreTop = producto.nombre;
          }
        });
        
        setProductoTop(nombreTop);
        setVentasProductoTop(maxVentas);
      } catch (error) {
        console.error('Error al cargar ventas:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarVentas();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarVentas, 30000);
    
    // ⭐ Escuchar evento de actualización de stock (cuando se hace una venta)
    const handleStockActualizado = () => {
      cargarVentas();
    };

    window.addEventListener('stockActualizado', handleStockActualizado);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('stockActualizado', handleStockActualizado);
    };
  }, []);

  // Cargar ventas por día para el gráfico
  useEffect(() => {
    const cargarVentasPorDia = async () => {
      try {
        const response = await fetch(`${API_URL}/api/ventas`);
        const ventas = await response.json();
        
        // Calcular fecha límite según el periodo
        const ahora = new Date();
        const fechaLimite = new Date();
        fechaLimite.setDate(ahora.getDate() - periodoGrafico);
        
        // Filtrar ventas del periodo
        const ventasPeriodo = ventas.filter((venta: any) => {
          const fechaVenta = new Date(venta.fecha);
          return fechaVenta >= fechaLimite;
        });
        
        // Agrupar ventas por día
        const ventasPorDiaMap: { [key: string]: number } = {};
        
        // Inicializar todos los días del periodo con 0
        for (let i = 0; i < periodoGrafico; i++) {
          const fecha = new Date();
          fecha.setDate(ahora.getDate() - (periodoGrafico - 1 - i));
          const diaKey = fecha.toISOString().split('T')[0];
          ventasPorDiaMap[diaKey] = 0;
        }
        
        // Sumar ventas por día
        ventasPeriodo.forEach((venta: any) => {
          const fecha = new Date(venta.fecha);
          const diaKey = fecha.toISOString().split('T')[0];
          ventasPorDiaMap[diaKey] = (ventasPorDiaMap[diaKey] || 0) + parseFloat(venta.total || 0);
        });
        
        // Convertir a array y formatear
        const ventasArray: VentaDia[] = Object.entries(ventasPorDiaMap).map(([dia, total]) => {
          const fecha = new Date(dia);
          let diaFormateado = '';
          
          if (periodoGrafico === 7) {
            // Para 7 días: Lun, Mar, Mié, etc.
            const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            diaFormateado = dias[fecha.getDay()];
          } else {
            // Para 30 y 90 días: DD/MM
            diaFormateado = `${fecha.getDate()}/${fecha.getMonth() + 1}`;
          }
          
          return { dia: diaFormateado, total };
        });
        
        setVentasPorDia(ventasArray);
      } catch (error) {
        console.error('Error al cargar ventas por día:', error);
      }
    };

    cargarVentasPorDia();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarVentasPorDia, 30000);
    
    // Escuchar evento de actualización
    const handleStockActualizado = () => {
      cargarVentasPorDia();
    };

    window.addEventListener('stockActualizado', handleStockActualizado);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('stockActualizado', handleStockActualizado);
    };
  }, [periodoGrafico]);

  const estadisticas: Estadistica[] = [
    {
      id: 'ventas',
      titulo: 'Ventas Totales',
      valor: cargando ? 'Cargando...' : `Q${ventasTotales.toFixed(2)}`,
      cambio: `${totalVentas} ventas`,
      porcentaje: 12.5,
      icono: '💰',
      color: '#10b981'
    },
    {
      id: 'productos',
      titulo: 'Productos',
      valor: `${totalProductos}`,
      cambio: `${stockTotal} unidades en stock`,
      porcentaje: 8.2,
      icono: '📦',
      color: '#3b82f6'
    },
    {
      id: 'stock-bajo',
      titulo: 'Stock Bajo',
      valor: `${productosStockBajo}`,
      cambio: 'Requieren reposición',
      porcentaje: productosStockBajo > 0 ? -10 : 0,
      icono: '⚠️',
      color: '#ef4444'
    },
    {
      id: 'producto-top',
      titulo: 'Producto Top',
      valor: productoTop,
      cambio: `${ventasProductoTop} unidades vendidas`,
      porcentaje: 15.3,
      icono: '🔥',
      color: '#f59e0b'
    }
  ];


  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-top-header">
        <h1>📊DASHBOARD</h1>
        <div className="header-buttons">
        </div>
      </div>

      <div className="dashboard-header">
        <p className="dashboard-subtitle">Bienvenido de vuelta. Aquí tienes un resumen de tu negocio.</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        {estadisticas.map((stat) => (
          <div key={stat.id} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: stat.color + '20' }}>
                <span style={{ color: stat.color }}>{stat.icono}</span>
              </div>
              <div className="stat-change">
                <span className={`change-value ${stat.porcentaje >= 0 ? 'positive' : 'negative'}`}>
                  {stat.cambio}
                </span>
              </div>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">{stat.titulo}</h3>
              <p className="stat-value">{stat.valor}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="dashboard-content">
        <div className="content-grid">
          {/* Productos recientes */}
          <div className="content-card">
            <div className="card-header">
              <h3>Productos Recientes</h3>
            </div>
            <div className="productos-table">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {productosRecientes.map((producto) => (
                    <tr key={producto.id}>
                      <td className="producto-nombre">{producto.nombre}</td>
                      <td className="producto-precio">{producto.precio}</td>
                      <td>
                        <span className={`stock-badge ${producto.stock < 10 ? 'bajo' : 'normal'}`}>
                          {producto.stock}
                        </span>
                      </td>
                      <td className="producto-categoria">{producto.categoria}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actividades recientes */}
          <div className="content-card">
            <div className="card-header">
              <h3>Actividades Recientes</h3>
            </div>
            <div className="actividades-list">
              {actividadesRecientes.map((actividad) => (
                <div key={actividad.id} className="actividad-item">
                  <div className="actividad-icon">
                    {actividad.tipo === 'venta' && '💰'}
                    {actividad.tipo === 'inventario' && '📦'}
                    {actividad.tipo === 'cliente' && '👥'}
                    {actividad.tipo === 'pedido' && '📋'}
                  </div>
                  <div className="actividad-content">
                    <p className="actividad-texto">{actividad.accion}</p>
                    <span className="actividad-tiempo">{actividad.tiempo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico de ventas */}
        <div className="content-card full-width">
          <div className="card-header">
            <h3>Ventas del Mes</h3>
            <div className="chart-controls">
              <button 
                className={`chart-btn ${periodoGrafico === 7 ? 'active' : ''}`}
                onClick={() => setPeriodoGrafico(7)}
              >
                7 días
              </button>
              <button 
                className={`chart-btn ${periodoGrafico === 30 ? 'active' : ''}`}
                onClick={() => setPeriodoGrafico(30)}
              >
                30 días
              </button>
              <button 
                className={`chart-btn ${periodoGrafico === 90 ? 'active' : ''}`}
                onClick={() => setPeriodoGrafico(90)}
              >
                90 días
              </button>
            </div>
          </div>
          <div className="chart-container">
            <div className="chart-placeholder">
              <div className="chart-bars">
                {ventasPorDia.length > 0 ? (
                  ventasPorDia.map((venta, index) => {
                    // Calcular altura proporcional (máximo 100%)
                    const maxVenta = Math.max(...ventasPorDia.map(v => v.total));
                    const altura = maxVenta > 0 ? (venta.total / maxVenta) * 100 : 0;
                    
                    return (
                      <div
                        key={index}
                        className="chart-bar"
                        style={{ height: `${altura}%` }}
                        title={`${venta.dia}: Q${venta.total.toFixed(2)}`}
                      ></div>
                    );
                  })
                ) : (
                  // Placeholder mientras carga
                  [0, 0, 0, 0, 0, 0, 0].map((_, index) => (
                    <div
                      key={index}
                      className="chart-bar"
                      style={{ height: '10%', opacity: 0.3 }}
                    ></div>
                  ))
                )}
              </div>
              <div className="chart-labels">
                {ventasPorDia.length > 0 ? (
                  ventasPorDia.map((venta, index) => (
                    <span key={index}>{venta.dia}</span>
                  ))
                ) : (
                  <>
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mié</span>
                    <span>Jue</span>
                    <span>Vie</span>
                    <span>Sáb</span>
                    <span>Dom</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 