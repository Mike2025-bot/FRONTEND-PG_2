import { useState, useEffect } from 'react';
import './Dashboard.css';
import { API_URL } from '../../config';

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
  fecha: string;
}

interface ProductoVendido {
  nombre: string;
  cantidad: number;
  total: number;
}

interface CategoriaVenta {
  categoria: string;
  total: number;
  porcentaje: number;
}

const Dashboard = () => {
  const [ventasTotales, setVentasTotales] = useState<number>(0);
  const [totalVentas, setTotalVentas] = useState<number>(0);
  const [totalProductos, setTotalProductos] = useState<number>(0);
  const [stockTotal, setStockTotal] = useState<number>(0);
  const [productosStockBajo, setProductosStockBajo] = useState<number>(0);
  const [productosRecientes, setProductosRecientes] = useState<ProductoReciente[]>([]);
  const [actividadesRecientes, setActividadesRecientes] = useState<ActividadReciente[]>([]);
  const [ventasPorDia, setVentasPorDia] = useState<VentaDia[]>([]);
  const [periodoGrafico, setPeriodoGrafico] = useState<7 | 30 | 90>(7);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargandoVentas, setCargandoVentas] = useState<boolean>(true);
  const [cargandoProductos, setCargandoProductos] = useState<boolean>(true);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [usarRangoPersonalizado, setUsarRangoPersonalizado] = useState<boolean>(false);
  const [topProductos, setTopProductos] = useState<ProductoVendido[]>([]);
  const [ventasPorCategoria, setVentasPorCategoria] = useState<CategoriaVenta[]>([]);
  const [barraHover, setBarraHover] = useState<number | null>(null);
  const [ventasMesAnterior, setVentasMesAnterior] = useState<number>(0);

  // Cargar productos desde la API
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargandoProductos(true);
        const response = await fetch(`${API_URL}/api/productos`);
        
        if (!response.ok) {
          throw new Error('Error al cargar productos');
        }
        
        const productos = await response.json();
        
        console.log('📦 Productos cargados:', productos.length);
        console.log('📊 Datos de productos:', productos);
        
        // Calcular total de productos y stock total
        const stock = productos.reduce((sum: number, producto: any) => {
          const stockActual = parseInt(producto.stock_actual) || 0;
          const stockMinimo = parseInt(producto.stock_minimo) || 0;
          console.log(`Producto: ${producto.nombre_producto}, Stock: ${stockActual}, Mínimo: ${stockMinimo}`);
          return sum + stockActual;
        }, 0);
        
        // Calcular productos con stock bajo (stock actual <= stock mínimo)
        const stockBajo = productos.filter((producto: any) => {
          const stockActual = parseInt(producto.stock_actual) || 0;
          const stockMinimo = parseInt(producto.stock_minimo) || 0;
          const tieneStockBajo = stockActual <= stockMinimo;
          
          if (tieneStockBajo) {
            console.log(`⚠️ Stock bajo: ${producto.nombre_producto} (${stockActual} <= ${stockMinimo})`);
          }
          
          return tieneStockBajo;
        }).length;
        
        console.log(`📊 Total productos con stock bajo: ${stockBajo}`);
        
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
        
        console.log(`✅ Productos cargados: ${productos.length}`);
        console.log(`✅ Stock total: ${stock}`);
        console.log(`✅ Productos con stock bajo: ${stockBajo}`);
        
      } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        // Establecer valores por defecto en caso de error
        setTotalProductos(0);
        setStockTotal(0);
        setProductosStockBajo(0);
        setProductosRecientes([]);
      } finally {
        setCargandoProductos(false);
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
        setCargandoVentas(true);
        const response = await fetch(`${API_URL}/api/ventas`);
        
        if (!response.ok) {
          throw new Error('Error al cargar ventas');
        }
        
        const ventas = await response.json();
        
        console.log('💰 Ventas cargadas:', ventas.length);
        
        // Calcular total de ventas
        const total = ventas.reduce((sum: number, venta: any) => {
          return sum + parseFloat(venta.total || 0);
        }, 0);
        
        setVentasTotales(total);
        setTotalVentas(ventas.length);
        
        // Calcular ventas del mes anterior para comparación
        const fechaActual = new Date();
        const inicioMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
        const finMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 0);
        
        const ventasMesAnteriorData = ventas.filter((venta: any) => {
          const fechaVenta = new Date(venta.fecha);
          return fechaVenta >= inicioMesAnterior && fechaVenta <= finMesAnterior;
        });
        
        const totalMesAnterior = ventasMesAnteriorData.reduce((sum: number, venta: any) => {
          return sum + parseFloat(venta.total || 0);
        }, 0);
        
        setVentasMesAnterior(totalMesAnterior);
        
        console.log(`✅ Ventas totales: Q${total.toFixed(2)}`);
        console.log(`✅ Total de ventas: ${ventas.length}`);
        console.log(`✅ Ventas mes anterior: Q${totalMesAnterior.toFixed(2)}`);
        
      } catch (error) {
        console.error('Error al cargar ventas:', error);
        // Establecer valores por defecto en caso de error
        setVentasTotales(0);
        setTotalVentas(0);
        setVentasMesAnterior(0);
      } finally {
        setCargandoVentas(false);
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

  // Cargar top productos más vendidos
  useEffect(() => {
    const cargarTopProductos = async () => {
      try {
        const response = await fetch(`${API_URL}/api/salidas/detalle-salidas`);
        const detalles = await response.json();
        
        // Agrupar por producto
        const productosMap: { [key: string]: { nombre: string, cantidad: number, total: number } } = {};
        
        detalles.forEach((detalle: any) => {
          const id = detalle.id_producto;
          const nombre = detalle.nombre_producto || 'Producto';
          const cantidad = parseInt(detalle.cantidad || 0);
          const subtotal = parseFloat(detalle.subtotal || 0);
          
          if (!productosMap[id]) {
            productosMap[id] = { nombre, cantidad: 0, total: 0 };
          }
          productosMap[id].cantidad += cantidad;
          productosMap[id].total += subtotal;
        });
        
        // Convertir a array y ordenar por cantidad
        const topProductosArray = Object.values(productosMap)
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5);
        
        setTopProductos(topProductosArray);
      } catch (error) {
        console.error('Error al cargar top productos:', error);
      }
    };

    cargarTopProductos();
    const interval = setInterval(cargarTopProductos, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Cargar ventas por categoría
  useEffect(() => {
    const cargarVentasPorCategoria = async () => {
      try {
        const response = await fetch(`${API_URL}/api/salidas/detalle-salidas`);
        const detalles = await response.json();
        
        // Agrupar por categoría
        const categoriasMap: { [key: string]: number } = {};
        
        detalles.forEach((detalle: any) => {
          const categoria = detalle.nombre_categoria || 'Sin categoría';
          const subtotal = parseFloat(detalle.subtotal || 0);
          
          if (!categoriasMap[categoria]) {
            categoriasMap[categoria] = 0;
          }
          categoriasMap[categoria] += subtotal;
        });
        
        // Calcular total y porcentajes
        const totalVentas = Object.values(categoriasMap).reduce((sum, val) => sum + val, 0);
        
        const categoriasArray: CategoriaVenta[] = Object.entries(categoriasMap)
          .map(([categoria, total]) => ({
            categoria,
            total,
            porcentaje: totalVentas > 0 ? (total / totalVentas) * 100 : 0
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
        
        setVentasPorCategoria(categoriasArray);
      } catch (error) {
        console.error('Error al cargar ventas por categoría:', error);
      }
    };

    cargarVentasPorCategoria();
    const interval = setInterval(cargarVentasPorCategoria, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Cargar ventas por día para el gráfico
  useEffect(() => {
    const cargarVentasPorDia = async () => {
      try {
        const response = await fetch(`${API_URL}/api/ventas`);
        const ventas = await response.json();
        
        let fechaLimite: Date;
        let fechaFinal: Date;
        
        if (usarRangoPersonalizado && fechaInicio && fechaFin) {
          // Usar rango personalizado
          fechaLimite = new Date(fechaInicio);
          fechaFinal = new Date(fechaFin);
        } else {
          // Usar periodo predefinido
          const ahora = new Date();
          fechaFinal = ahora;
          fechaLimite = new Date();
          fechaLimite.setDate(ahora.getDate() - periodoGrafico);
        }
        
        // Filtrar ventas del periodo
        const ventasPeriodo = ventas.filter((venta: any) => {
          const fechaVenta = new Date(venta.fecha);
          return fechaVenta >= fechaLimite && fechaVenta <= fechaFinal;
        });
        
        // Calcular número de días
        const diasDiferencia = Math.ceil((fechaFinal.getTime() - fechaLimite.getTime()) / (1000 * 60 * 60 * 24));
        const numDias = usarRangoPersonalizado ? diasDiferencia : periodoGrafico;
        
        // Agrupar ventas por día
        const ventasPorDiaMap: { [key: string]: number } = {};
        
        // Inicializar todos los días del periodo con 0
        for (let i = 0; i < numDias; i++) {
          const fecha = new Date(fechaLimite);
          fecha.setDate(fechaLimite.getDate() + i);
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
          
          if (numDias <= 7) {
            // Para 7 días o menos: Lun, Mar, Mié, etc.
            const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            diaFormateado = dias[fecha.getDay()];
          } else if (numDias <= 31) {
            // Para hasta 31 días: DD/MM
            diaFormateado = `${fecha.getDate()}/${fecha.getMonth() + 1}`;
          } else {
            // Para más días: DD/MM
            diaFormateado = `${fecha.getDate()}/${fecha.getMonth() + 1}`;
          }
          
          return { dia: diaFormateado, total, fecha: dia };
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
  }, [periodoGrafico, usarRangoPersonalizado, fechaInicio, fechaFin]);

  // Calcular porcentaje de cambio vs mes anterior
  const calcularCambio = () => {
    if (ventasMesAnterior === 0) return 0;
    return ((ventasTotales - ventasMesAnterior) / ventasMesAnterior) * 100;
  };

  const estadisticas: Estadistica[] = [
    {
      id: 'ventas',
      titulo: 'Ventas Totales',
      valor: cargandoVentas ? 'Cargando...' : `Q${ventasTotales.toFixed(2)}`,
      cambio: ventasMesAnterior > 0 ? `${calcularCambio() >= 0 ? '+' : ''}${calcularCambio().toFixed(1)}% vs mes anterior` : `${totalVentas} ventas`,
      porcentaje: calcularCambio(),
      icono: '💰',
      color: '#10b981'
    },
    {
      id: 'productos',
      titulo: 'Productos',
      valor: cargandoProductos ? 'Cargando...' : `${totalProductos}`,
      cambio: cargandoProductos ? 'Calculando...' : `${stockTotal.toLocaleString()} unidades en stock`,
      porcentaje: 8.2,
      icono: '📦',
      color: '#3b82f6'
    },
    {
      id: 'stock-bajo',
      titulo: 'Stock Bajo',
      valor: cargandoProductos ? 'Cargando...' : `${productosStockBajo}`,
      cambio: productosStockBajo > 0 ? 'Requieren reposición' : 'Todo en orden',
      porcentaje: productosStockBajo > 0 ? -10 : 0,
      icono: '⚠️',
      color: '#ef4444'
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
            <h3>📈 Ventas por Período</h3>
            <div className="chart-controls">
              <button 
                className={`chart-btn ${!usarRangoPersonalizado && periodoGrafico === 7 ? 'active' : ''}`}
                onClick={() => {
                  setUsarRangoPersonalizado(false);
                  setPeriodoGrafico(7);
                }}
              >
                7 días
              </button>
              <button 
                className={`chart-btn ${!usarRangoPersonalizado && periodoGrafico === 30 ? 'active' : ''}`}
                onClick={() => {
                  setUsarRangoPersonalizado(false);
                  setPeriodoGrafico(30);
                }}
              >
                30 días
              </button>
              <button 
                className={`chart-btn ${!usarRangoPersonalizado && periodoGrafico === 90 ? 'active' : ''}`}
                onClick={() => {
                  setUsarRangoPersonalizado(false);
                  setPeriodoGrafico(90);
                }}
              >
                90 días
              </button>
            </div>
          </div>
          
          {/* Selector de fechas personalizado */}
          <div className="date-selector">
            <div className="date-inputs">
              <div className="date-input-group">
                <label>📅 Fecha Inicio:</label>
                <input 
                  type="date" 
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    if (e.target.value && fechaFin) {
                      setUsarRangoPersonalizado(true);
                    }
                  }}
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label>📅 Fecha Fin:</label>
                <input 
                  type="date" 
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    if (fechaInicio && e.target.value) {
                      setUsarRangoPersonalizado(true);
                    }
                  }}
                  className="date-input"
                />
              </div>
              {usarRangoPersonalizado && (
                <button 
                  className="reset-btn"
                  onClick={() => {
                    setUsarRangoPersonalizado(false);
                    setFechaInicio('');
                    setFechaFin('');
                  }}
                >
                  🔄 Restablecer
                </button>
              )}
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
                        className="chart-bar-wrapper"
                        onMouseEnter={() => setBarraHover(index)}
                        onMouseLeave={() => setBarraHover(null)}
                      >
                        {barraHover === index && (
                          <div className="chart-tooltip">
                            <div className="tooltip-date">{venta.fecha}</div>
                            <div className="tooltip-value">Q{venta.total.toFixed(2)}</div>
                          </div>
                        )}
                        <div
                          className="chart-bar"
                          style={{ height: `${Math.max(altura, 5)}%` }}
                        >
                          {altura > 15 && (
                            <span className="bar-value">Q{venta.total.toFixed(0)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Placeholder mientras carga
                  [0, 0, 0, 0, 0, 0, 0].map((_, index) => (
                    <div key={index} className="chart-bar-wrapper">
                      <div
                        className="chart-bar"
                        style={{ height: '10%', opacity: 0.3 }}
                      ></div>
                    </div>
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

        {/* Top 5 Productos Más Vendidos - Contenedor expandido */}
        <div className="content-card full-width">
          <div className="card-header">
            <h3>🏆 Top 5 Productos Más Vendidos</h3>
          </div>
          <div className="top-productos-chart expanded">
            {topProductos.length > 0 ? (
              topProductos.map((producto, index) => {
                const maxCantidad = Math.max(...topProductos.map(p => p.cantidad));
                const porcentaje = (producto.cantidad / maxCantidad) * 100;
                
                return (
                  <div key={index} className="producto-bar-item expanded">
                    <div className="producto-nombre-chart expanded" title={producto.nombre}>
                      {producto.nombre}
                    </div>
                    <div className="producto-bar-container expanded">
                      <div 
                        className="producto-bar-fill expanded" 
                        style={{ width: `${porcentaje}%` }}
                        title={`${producto.cantidad} unidades - Q${producto.total.toFixed(2)}`}
                      >
                        <span className="producto-cantidad expanded">{producto.cantidad} unidades - Q${producto.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No hay datos disponibles</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
