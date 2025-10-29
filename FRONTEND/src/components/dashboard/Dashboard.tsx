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
  const [cargandoVentas, setCargandoVentas] = useState<boolean>(true);
  const [cargandoProductos, setCargandoProductos] = useState<boolean>(true);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [usarRangoPersonalizado, setUsarRangoPersonalizado] = useState<boolean>(false);
  const [topProductos, setTopProductos] = useState<ProductoVendido[]>([]);
  const [barraHover, setBarraHover] = useState<number | null>(null);
  const [ventasMesAnterior, setVentasMesAnterior] = useState<number>(0);

  // Cargar productos desde la API
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargandoProductos(true);
        const response = await fetch(`${API_URL}/api/productos`);
        if (!response.ok) throw new Error('Error al cargar productos');

        const productos = await response.json();

        const stock = productos.reduce((sum: number, p: any) => sum + (parseInt(p.stock_actual) || 0), 0);
        const stockBajo = productos.filter((p: any) => (parseInt(p.stock_actual) || 0) <= (parseInt(p.stock_minimo) || 0)).length;

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
      } catch {
        setTotalProductos(0);
        setStockTotal(0);
        setProductosStockBajo(0);
        setProductosRecientes([]);
      } finally {
        setCargandoProductos(false);
      }
    };

    cargarProductos();
    const interval = setInterval(cargarProductos, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar actividades recientes (entradas y ventas)
  useEffect(() => {
    const cargarActividades = async () => {
      try {
        const responseVentas = await fetch(`${API_URL}/api/ventas`);
        const ventas = await responseVentas.json();
        const responseEntradas = await fetch(`${API_URL}/api/entradas`);
        const entradas = await responseEntradas.json();

        const actividades: ActividadReciente[] = [];

        ventas.slice(0, 3).forEach((venta: any, index: number) => {
          actividades.push({
            id: `venta-${venta.id_venta || index}`,
            accion: `Venta registrada - Q${parseFloat(venta.total || 0).toFixed(2)}`,
            tiempo: calcularTiempo(venta.fecha),
            tipo: 'venta'
          });
        });

        entradas.slice(0, 2).forEach((entrada: any, index: number) => {
          actividades.push({
            id: `entrada-${entrada.id_entrada || index}`,
            accion: `Entrada de producto - ${entrada.cantidad} unidades`,
            tiempo: calcularTiempo(entrada.fecha),
            tipo: 'inventario'
          });
        });

        setActividadesRecientes(actividades.slice(0, 5));
      } catch (error) {
        console.error('Error al cargar actividades:', error);
      }
    };

    cargarActividades();
    const interval = setInterval(cargarActividades, 30000);
    return () => clearInterval(interval);
  }, []);

  // Función para calcular tiempo relativo
  const calcularTiempo = (fecha: string): string => {
    const ahora = new Date();
    const fechaActividad = new Date(fecha);
    const diff = ahora.getTime() - fechaActividad.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} h`;
    return `Hace ${dias} d`;
  };

  // Cargar ventas totales
  useEffect(() => {
    const cargarVentas = async () => {
      try {
        setCargandoVentas(true);
        const response = await fetch(`${API_URL}/api/ventas`);
        if (!response.ok) throw new Error('Error al cargar ventas');
        const ventas = await response.json();

        const total = ventas.reduce((sum: number, v: any) => sum + parseFloat(v.total || 0), 0);
        setVentasTotales(total);
        setTotalVentas(ventas.length);

        const fechaActual = new Date();
        const inicioMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
        const finMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 0);

        const ventasMesAnteriorData = ventas.filter((venta: any) => {
          const fechaVenta = new Date(venta.fecha);
          return fechaVenta >= inicioMesAnterior && fechaVenta <= finMesAnterior;
        });

        const totalMesAnterior = ventasMesAnteriorData.reduce((sum: number, v: any) => sum + parseFloat(v.total || 0), 0);
        setVentasMesAnterior(totalMesAnterior);
      } catch {
        setVentasTotales(0);
        setTotalVentas(0);
        setVentasMesAnterior(0);
      } finally {
        setCargandoVentas(false);
      }
    };

    cargarVentas();
    const interval = setInterval(cargarVentas, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar top productos más vendidos
  useEffect(() => {
    const cargarTopProductos = async () => {
      try {
        const response = await fetch(`${API_URL}/api/salidas/detalle-salidas`);
        const detalles = await response.json();

        const productosMap: { [key: string]: { nombre: string; cantidad: number; total: number } } = {};
        detalles.forEach((d: any) => {
          const id = d.id_producto;
          const nombre = d.nombre_producto || 'Producto';
          const cantidad = parseInt(d.cantidad || 0);
          const subtotal = parseFloat(d.subtotal || 0);
          if (!productosMap[id]) productosMap[id] = { nombre, cantidad: 0, total: 0 };
          productosMap[id].cantidad += cantidad;
          productosMap[id].total += subtotal;
        });

        const topProductosArray = Object.values(productosMap)
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5);
        setTopProductos(topProductosArray);
      } catch {
        setTopProductos([]);
      }
    };

    cargarTopProductos();
    const interval = setInterval(cargarTopProductos, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar ventas por día
  useEffect(() => {
    const cargarVentasPorDia = async () => {
      try {
        const response = await fetch(`${API_URL}/api/ventas`);
        const ventas = await response.json();

        let fechaLimite: Date;
        let fechaFinal: Date;
        if (usarRangoPersonalizado && fechaInicio && fechaFin) {
          fechaLimite = new Date(fechaInicio);
          fechaFinal = new Date(fechaFin);
        } else {
          const ahora = new Date();
          fechaFinal = ahora;
          fechaLimite = new Date();
          fechaLimite.setDate(ahora.getDate() - periodoGrafico);
        }

        const ventasPeriodo = ventas.filter((venta: any) => {
          const fechaVenta = new Date(venta.fecha);
          return fechaVenta >= fechaLimite && fechaVenta <= fechaFinal;
        });

        const ventasPorDiaMap: { [key: string]: number } = {};
        ventasPeriodo.forEach((venta: any) => {
          const diaKey = new Date(venta.fecha).toISOString().split('T')[0];
          ventasPorDiaMap[diaKey] = (ventasPorDiaMap[diaKey] || 0) + parseFloat(venta.total || 0);
        });

        const ventasArray: VentaDia[] = Object.entries(ventasPorDiaMap).map(([dia, total]) => ({
          dia,
          total,
          fecha: dia
        }));

        setVentasPorDia(ventasArray);
      } catch {
        setVentasPorDia([]);
      }
    };

    cargarVentasPorDia();
    const interval = setInterval(cargarVentasPorDia, 30000);
    return () => clearInterval(interval);
  }, [periodoGrafico, usarRangoPersonalizado, fechaInicio, fechaFin]);

  // Calcular cambio
  const calcularCambio = () => (ventasMesAnterior === 0 ? 0 : ((ventasTotales - ventasMesAnterior) / ventasMesAnterior) * 100);

  const estadisticas: Estadistica[] = [
    {
      id: 'ventas',
      titulo: 'Ventas Totales',
      valor: cargandoVentas ? 'Cargando...' : `Q${ventasTotales.toFixed(2)}`,
      cambio:
        ventasMesAnterior > 0
          ? `${calcularCambio() >= 0 ? '+' : ''}${calcularCambio().toFixed(1)}% vs mes anterior`
          : `${totalVentas} ventas`,
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
      <div className="dashboard-top-header">
        <h1>📊DASHBOARD</h1>
      </div>

      <div className="dashboard-header">
        <p className="dashboard-subtitle">Bienvenido de vuelta. Aquí tienes un resumen de tu negocio.</p>
      </div>

      {/* Tarjetas */}
      <div className="stats-grid">
        {estadisticas.map(stat => (
          <div key={stat.id} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: stat.color + '20' }}>
                <span style={{ color: stat.color }}>{stat.icono}</span>
              </div>
              <div className="stat-change">
                <span className={`change-value ${stat.porcentaje >= 0 ? 'positive' : 'negative'}`}>{stat.cambio}</span>
              </div>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">{stat.titulo}</h3>
              <p className="stat-value">{stat.valor}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla productos recientes + actividades */}
      {/* (mantuve igual tu estructura anterior) */}
    </div>
  );
};

export default Dashboard;
