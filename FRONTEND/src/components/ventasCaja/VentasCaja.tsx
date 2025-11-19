import { useState, useEffect, useRef } from "react";
import "./VentasCaja.css";
import API_URL from "../../config";

interface Producto {
  id_producto: number;
  codigo_barras: string;
  nombre_producto: string;
  precio_venta: number;
  stock_actual: number;
  id_categoria: number;
}

interface ProductoVenta {
  id_producto: number;
  codigo_barras: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
}

interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
}

interface ProductoReporte {
  id_salida: number;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  nombre_producto: string;
  codigo_barras: string;
}

interface VentaReporte {
  id_venta: number;
  fecha_venta: string;
  total: string;
  efectivo: string;
  cambio: string;
  nombre_cajero: string;
  productos: ProductoReporte[];
}

const VentasCaja = () => {
  // Estados principales
  const [codigoBarras, setCodigoBarras] = useState<string>("");
  const [cantidad, setCantidad] = useState<number | string>("");
  const [cajero, setCajero] = useState<string>("");
  const [productosVenta, setProductosVenta] = useState<ProductoVenta[]>([]);
  const [efectivo, setEfectivo] = useState<number | string>("");
  const [modoEdicion, setModoEdicion] = useState<boolean>(false);
  const [productosRespaldo, setProductosRespaldo] = useState<ProductoVenta[]>([]);

  // Estados para configuración del negocio
  const [nombreNegocio, setNombreNegocio] = useState(
    localStorage.getItem('nombreNegocio') || 'SOWIN'
  );
  const [direccionNegocio, setDireccionNegocio] = useState(
    localStorage.getItem('direccionNegocio') || ''
  );
  const [telefonoNegocio, setTelefonoNegocio] = useState(
    localStorage.getItem('telefonoNegocio') || ''
  );
  const [mostrarModalConfiguracion, setMostrarModalConfiguracion] = useState(false);
  const [mostrarModalCerrarCaja, setMostrarModalCerrarCaja] = useState(false);
  
  // Estados para el modal de búsqueda
  const [mostrarModalBusqueda, setMostrarModalBusqueda] = useState<boolean>(false);
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [busquedaModal, setBusquedaModal] = useState<string>("");
  const [productoSeleccionadoModal, setProductoSeleccionadoModal] = useState<Producto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [mostrarCategorias, setMostrarCategorias] = useState<boolean>(false);
  
  // Ref para el input de código de barras
  const inputCodigoRef = useRef<HTMLInputElement>(null);

  // Calcular totales
  const totalVenta = productosVenta.reduce((sum, item) => sum + item.total, 0);
  const efectivoNumero = typeof efectivo === 'string' ? (efectivo === '' ? 0 : parseFloat(efectivo)) : efectivo;
  const cambio = efectivoNumero - totalVenta;

  // Estado para verificar si es administrador
  const [esAdministrador, setEsAdministrador] = useState(false);

  // Cargar nombre del cajero y verificar rol desde localStorage
  useEffect(() => {
    const usuarioLogueado = localStorage.getItem('usuario');
    if (usuarioLogueado) {
      const usuario = JSON.parse(usuarioLogueado);
      setCajero(usuario.nombre_usuario || "");
      
      // Verificar si es administrador (insensible a mayúsculas/minúsculas)
      const rol = (usuario.rol || usuario.nombre_rol || '').toUpperCase();
      const esAdmin = rol === 'ADMINISTRADOR' || rol === 'ADMIN';
      
      setEsAdministrador(esAdmin);
    }
  }, []);

  // Enfocar automáticamente el input de código de barras
  useEffect(() => {
    inputCodigoRef.current?.focus();
  }, [productosVenta]);

  // Buscar producto por código de barras
  const buscarProducto = async (codigo: string) => {
    if (!codigo.trim()) return;

    // Si cantidad está vacía, usar 1 por defecto
    const cantidadFinal = typeof cantidad === 'string' && cantidad === '' ? 1 : Number(cantidad);
    if (cantidadFinal <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/productos/buscar/${codigo}`);
      const data = await response.json();

      if (data.encontrado && data.producto) {
        agregarProductoAVenta(data.producto, cantidadFinal);
      } else {
        alert(`Producto con código ${codigo} no encontrado`);
      }
    } catch (error) {
      console.error('Error al buscar producto:', error);
      alert('Error al buscar el producto');
    }
  };

  // Agregar producto a la venta
  const agregarProductoAVenta = (producto: Producto, cantidadAgregar: number = 1) => {
    // Convertir precio_venta a número para evitar errores
    const precioVenta = Number(producto.precio_venta);

    // Verificar si el producto ya está en la lista
    const productoExistente = productosVenta.find(p => p.id_producto === producto.id_producto);

    if (productoExistente) {
      // Calcular la nueva cantidad total
      const nuevaCantidadTotal = productoExistente.cantidad + cantidadAgregar;
      
      // Verificar stock disponible
      if (nuevaCantidadTotal > producto.stock_actual) {
        alert(`Stock insuficiente. Solo hay ${producto.stock_actual} unidades disponibles.\nYa tienes ${productoExistente.cantidad} en la venta.`);
        return;
      }

      // Actualizar cantidad si ya existe
      setProductosVenta(productosVenta.map(p =>
        p.id_producto === producto.id_producto
          ? { 
              ...p, 
              cantidad: nuevaCantidadTotal, 
              total: nuevaCantidadTotal * Number(p.precio_unitario)
            }
          : p
      ));
    } else {
      // Verificar stock para producto nuevo
      if (cantidadAgregar > producto.stock_actual) {
        alert(`Stock insuficiente. Solo hay ${producto.stock_actual} unidades disponibles`);
        return;
      }

      // Agregar nuevo producto
      const nuevoProducto: ProductoVenta = {
        id_producto: producto.id_producto,
        codigo_barras: producto.codigo_barras,
        descripcion: producto.nombre_producto,
        cantidad: cantidadAgregar,
        precio_unitario: precioVenta,
        total: cantidadAgregar * precioVenta
      };
      setProductosVenta([...productosVenta, nuevoProducto]);
    }

    // Limpiar campos
    setCodigoBarras("");
    setCantidad("");
  };

  // Manejar Enter en el input de código de barras
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      buscarProducto(codigoBarras);
    }
  };

  // Limpiar ventas
  const limpiarVentas = () => {
    setProductosVenta([]);
    setEfectivo("");
    setCodigoBarras("");
    setCantidad("");
  };

  // Editar/Eliminar producto de la venta
  const eliminarProducto = (id_producto: number) => {
    setProductosVenta(productosVenta.filter(p => p.id_producto !== id_producto));
  };

  // Activar modo edición (guardar respaldo)
  const activarModoEdicion = () => {
    // Guardar copia de seguridad antes de editar
    setProductosRespaldo([...productosVenta]);
    setModoEdicion(true);
  };

  // Guardar cambios de edición
  const guardarEdicion = () => {
    // Validar que todas las cantidades sean válidas
    const hayErrores = productosVenta.some(p => !p.cantidad || p.cantidad <= 0);
    
    if (hayErrores) {
      alert('⚠️ Error: Todas las cantidades deben ser mayores a 0');
      return;
    }
    
    setModoEdicion(false);
    setProductosRespaldo([]);
    alert('✅ Cambios guardados correctamente');
  };

  // Cancelar edición (restaurar respaldo)
  const cancelarEdicion = () => {
    setProductosVenta([...productosRespaldo]);
    setModoEdicion(false);
    setProductosRespaldo([]);
    alert('❌ Cambios cancelados');
  };

  // Actualizar cantidad de un producto
  const actualizarCantidad = (id_producto: number, nuevaCantidad: number | string) => {
    // Permitir vacío temporalmente, pero validar al guardar
    const cantidad = nuevaCantidad === '' ? '' : Number(nuevaCantidad);
    
    setProductosVenta(productosVenta.map(p =>
      p.id_producto === id_producto
        ? { 
            ...p, 
            cantidad: cantidad === '' ? 1 : cantidad, 
            total: (cantidad === '' ? 1 : cantidad) * p.precio_unitario 
          }
        : p
    ));
  };

  // Calcular stock disponible (restando lo que ya está en la venta)
  const calcularStockDisponible = (producto: Producto): number => {
    const productoEnVenta = productosVenta.find(p => p.id_producto === producto.id_producto);
    if (productoEnVenta) {
      return producto.stock_actual - productoEnVenta.cantidad;
    }
    return producto.stock_actual;
  };

  // Abrir modal de búsqueda de productos
  const abrirModalBusqueda = async () => {
    try {
      // Cargar productos
      const responseProductos = await fetch(`${API_URL}/api/productos`);
      const dataProductos = await responseProductos.json();
      setProductosDisponibles(dataProductos);
      setProductosFiltrados(dataProductos);

      // Cargar categorías
      const responseCategorias = await fetch(`${API_URL}/api/categorias`);
      const dataCategorias = await responseCategorias.json();
      setCategorias(dataCategorias);

      setMostrarModalBusqueda(true);
      setBusquedaModal('');
      setProductoSeleccionadoModal(null);
      setCategoriaSeleccionada(null);

      // Bloquear scroll del body
      document.body.style.overflow = 'hidden';
    } catch (error) {
      console.error('Error al cargar productos:', error);
      alert('Error al cargar los productos');
    }
  };

  // Cerrar modal de búsqueda
  const cerrarModalBusqueda = () => {
    setMostrarModalBusqueda(false);
    setBusquedaModal('');
    setProductoSeleccionadoModal(null);
    setCategoriaSeleccionada(null);
    setMostrarCategorias(false);

    // Restaurar scroll del body
    document.body.style.overflow = 'unset';
  };

  // Filtrar productos en tiempo real (búsqueda inteligente)
  const filtrarProductosInteligente = (textoBusqueda: string, idCategoria: number | null) => {
    let filtrados = productosDisponibles;

    // Filtrar por categoría si hay una seleccionada
    if (idCategoria !== null) {
      filtrados = filtrados.filter(p => p.id_categoria === idCategoria);
    }

    // Filtrar por texto de búsqueda
    if (textoBusqueda.trim()) {
      const busqueda = textoBusqueda.toLowerCase();
      filtrados = filtrados.filter(p =>
        p.nombre_producto.toLowerCase().includes(busqueda) ||
        p.codigo_barras.toLowerCase().includes(busqueda)
      );
    }

    setProductosFiltrados(filtrados);
  };

  // Manejar cambio en el input de búsqueda (tiempo real)
  const handleBusquedaChange = (texto: string) => {
    setBusquedaModal(texto);
    filtrarProductosInteligente(texto, categoriaSeleccionada);
  };

  // Seleccionar categoría
  const seleccionarCategoria = (idCategoria: number | null) => {
    setCategoriaSeleccionada(idCategoria);
    filtrarProductosInteligente(busquedaModal, idCategoria);
    setMostrarCategorias(false);
  };

  // Limpiar búsqueda del modal
  const limpiarBusquedaModal = () => {
    setBusquedaModal('');
    setCategoriaSeleccionada(null);
    setProductosFiltrados(productosDisponibles);
    setProductoSeleccionadoModal(null);
  };

  // Seleccionar producto del modal
  const seleccionarProductoModal = (producto: Producto) => {
    setProductoSeleccionadoModal(producto);
  };

  // Aceptar producto seleccionado
  const aceptarProductoModal = () => {
    if (productoSeleccionadoModal) {
      setCodigoBarras(productoSeleccionadoModal.codigo_barras);
      cerrarModalBusqueda();
      // Enfocar el input de código de barras
      setTimeout(() => {
        inputCodigoRef.current?.focus();
      }, 100);
    } else {
      alert('Por favor selecciona un producto');
    }
  };

  // Abrir modal de configuración (solo administradores)
  const abrirModalConfiguracion = () => {
    if (!esAdministrador) {
      alert('⚠️ Acceso denegado\n\nSolo los administradores pueden configurar el negocio.');
      return;
    }
    setMostrarModalConfiguracion(true);
    document.body.style.overflow = 'hidden';
  };

  // Cerrar modal de configuración
  const cerrarModalConfiguracion = () => {
    setMostrarModalConfiguracion(false);
    document.body.style.overflow = 'unset';
  };

  // Guardar configuración del negocio
  const guardarConfiguracion = () => {
    localStorage.setItem('nombreNegocio', nombreNegocio);
    localStorage.setItem('direccionNegocio', direccionNegocio);
    localStorage.setItem('telefonoNegocio', telefonoNegocio);
    
    // Disparar evento personalizado para actualizar el Sidebar
    window.dispatchEvent(new Event('nombreNegocioActualizado'));
    
    alert('✅ Configuración guardada correctamente');
    cerrarModalConfiguracion();
  };

  // Abrir modal de cerrar caja
  const abrirModalCerrarCaja = () => {
    if (productosVenta.length > 0) {
      alert('⚠️ Tienes una venta pendiente. Por favor, completa o limpia la venta antes de cerrar caja.');
      return;
    }
    setMostrarModalCerrarCaja(true);
    document.body.style.overflow = 'hidden';
  };

  // Cerrar modal de cerrar caja
  const cerrarModalCerrarCaja = () => {
    setMostrarModalCerrarCaja(false);
    document.body.style.overflow = 'unset';
  };

  // Generar reporte de cierre de caja
  const generarReporteCierre = async () => {
    try {
      // Obtener información del usuario
      const usuarioLogueado = localStorage.getItem('usuario');
      let idUsuario = null;
      let nombreUsuario = '';
      
      if (usuarioLogueado) {
        const usuario = JSON.parse(usuarioLogueado);
        idUsuario = usuario.id_usuario;
        nombreUsuario = usuario.nombre_usuario || '';
      }

      // Obtener ventas del día del cajero
      const response = await fetch(`${API_URL}/api/ventas/cajero/${idUsuario}`);
      
      if (!response.ok) {
        // Si el endpoint no existe, mostrar mensaje informativo
        if (response.status === 404) {
          alert('⚠️ Endpoint no configurado\n\nEl endpoint /api/ventas/cajero/:id no existe en el backend.\n\nPor favor, crea este endpoint para generar el reporte de cierre.');
          cerrarModalCerrarCaja();
          return;
        }
        throw new Error('Error al obtener las ventas');
      }

      const ventas: VentaReporte[] = await response.json();

      // Calcular totales
      const totalVentas = ventas.length;
      const totalIngresos = ventas.reduce((sum: number, venta: VentaReporte) => sum + parseFloat(venta.total), 0);

      // Generar reporte en ventana nueva
      imprimirReporteCierre(nombreUsuario, totalVentas, totalIngresos, ventas);
      
    } catch (error) {
      console.error('Error al generar reporte:', error);
      alert('❌ Error al generar el reporte de cierre\n\nVerifica que el backend esté funcionando correctamente.');
      cerrarModalCerrarCaja();
    }
  };

  // Imprimir reporte de cierre
  const imprimirReporteCierre = (nombreCajero: string, totalVentas: number, totalIngresos: number, ventas: VentaReporte[]) => {
    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
    
    if (!ventanaImpresion) {
      alert('No se pudo abrir la ventana de impresión.');
      return;
    }

    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-GT');
    const hora = ahora.toLocaleTimeString('es-GT');
    
    // Generar número de reporte único basado en fecha y hora
    const numeroReporte = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}-${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}${String(ahora.getSeconds()).padStart(2, '0')}`;

    const reporteHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Cierre de Caja</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: white;
          }
          .reporte {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #2c3e50;
            font-size: 28px;
            margin-bottom: 5px;
          }
          .header h2 {
            color: #7f8c8d;
            font-size: 18px;
            font-weight: normal;
          }
          .info-section {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #bdc3c7;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: bold;
            color: #2c3e50;
          }
          .resumen {
            background: #3498db;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .resumen h3 {
            margin-bottom: 15px;
            font-size: 20px;
          }
          .resumen-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 16px;
          }
          .resumen-total {
            border-top: 2px solid white;
            margin-top: 10px;
            padding-top: 10px;
            font-size: 20px;
            font-weight: bold;
          }
          .tabla-ventas {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .tabla-ventas th {
            background: #2c3e50;
            color: white;
            padding: 12px;
            text-align: left;
          }
          .tabla-ventas td {
            padding: 10px 12px;
            border-bottom: 1px solid #ecf0f1;
          }
          .tabla-ventas tr:nth-child(even) {
            background: #f8f9fa;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #2c3e50;
            color: #7f8c8d;
          }
          @media print {
            body {
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="reporte">
          <div class="header">
            <h1>${nombreNegocio}</h1>
            <h2>Reporte de Cierre de Caja</h2>
            <p style="font-size: 14px; color: #7f8c8d; margin-top: 8px;">Reporte No. ${numeroReporte}</p>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Cajero:</span>
              <span style="font-weight: bold; color: #2c3e50;">${nombreCajero}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha de Cierre:</span>
              <span>${fecha}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hora de Cierre:</span>
              <span>${hora}</span>
            </div>
          </div>

          <div class="resumen">
            <h3>📊 Resumen del Día</h3>
            <div class="resumen-item">
              <span>Total de Ventas:</span>
              <span>${totalVentas}</span>
            </div>
            <div class="resumen-item resumen-total">
              <span>Total Ingresos:</span>
              <span>Q${totalIngresos.toFixed(2)}</span>
            </div>
          </div>

          <h3 style="margin-bottom: 10px; color: #2c3e50;">Detalle de Ventas</h3>
          ${ventas.map(venta => `
            <div style="margin-bottom: 25px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
              <div style="background: #34495e; color: white; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="font-size: 16px;">Venta #${venta.id_venta}</strong>
                  <span style="margin-left: 15px; font-size: 14px;">${new Date(venta.fecha_venta).toLocaleTimeString('es-GT')}</span>
                </div>
                <div style="font-size: 18px; font-weight: bold;">Q${parseFloat(venta.total).toFixed(2)}</div>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #ecf0f1;">
                    <th style="padding: 8px; text-align: left; border-bottom: 2px solid #bdc3c7;">Producto</th>
                    <th style="padding: 8px; text-align: center; border-bottom: 2px solid #bdc3c7;">Cant.</th>
                    <th style="padding: 8px; text-align: right; border-bottom: 2px solid #bdc3c7;">Precio</th>
                    <th style="padding: 8px; text-align: right; border-bottom: 2px solid #bdc3c7;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${venta.productos.map(prod => `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #ecf0f1;">${prod.nombre_producto}</td>
                      <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ecf0f1;">${prod.cantidad}</td>
                      <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ecf0f1;">Q${parseFloat(prod.precio_unitario).toFixed(2)}</td>
                      <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ecf0f1;">Q${parseFloat(prod.subtotal).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div style="background: #f8f9fa; padding: 10px 15px; display: flex; justify-content: space-between; font-size: 14px;">
                <div>
                  <span style="color: #7f8c8d;">Efectivo: </span>
                  <strong>Q${parseFloat(venta.efectivo).toFixed(2)}</strong>
                  <span style="margin-left: 15px; color: #7f8c8d;">Cambio: </span>
                  <strong>Q${parseFloat(venta.cambio).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          `).join('')}

          <div class="footer">
            <p><strong>${nombreNegocio}</strong></p>
            <p>Reporte generado el ${fecha} a las ${hora}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    ventanaImpresion.document.write(reporteHTML);
    ventanaImpresion.document.close();

    ventanaImpresion.onload = () => {
      ventanaImpresion.focus();
      ventanaImpresion.print();
    };

    cerrarModalCerrarCaja();
  };

  // Generar e imprimir ticket
  const imprimirTicket = () => {
    if (productosVenta.length === 0) {
      alert('No hay productos en la venta para imprimir');
      return;
    }

    // Crear ventana de impresión
    const ventanaImpresion = window.open('', '_blank', 'width=300,height=600');
    
    if (!ventanaImpresion) {
      alert('No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador.');
      return;
    }

    // Obtener fecha y hora actual
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-GT');
    const hora = ahora.toLocaleTimeString('es-GT');

    // Generar HTML del ticket
    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket de Venta</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            width: 280px;
          }
          .ticket {
            width: 100%;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
          }
          .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
          }
          .info {
            margin-bottom: 10px;
            font-size: 11px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .productos {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin-bottom: 10px;
          }
          .producto {
            margin-bottom: 8px;
          }
          .producto-nombre {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .producto-detalle {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }
          .totales {
            margin-top: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 12px;
          }
          .total-row.final {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-size: 11px;
          }
          @media print {
            body {
              width: 80mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>${nombreNegocio}</h1>
            <p>Factura...</p>
            ${direccionNegocio ? `<p style="font-size: 10px; margin-top: 3px;">${direccionNegocio}</p>` : ''}
            ${telefonoNegocio ? `<p style="font-size: 10px;">Tel: ${telefonoNegocio}</p>` : ''}
          </div>
          
          <div class="info">
            <div class="info-row">
              <span>Fecha:</span>
              <span>${fecha}</span>
            </div>
            <div class="info-row">
              <span>Hora:</span>
              <span>${hora}</span>
            </div>
            <div class="info-row">
              <span>Cajero:</span>
              <span>${cajero}</span>
            </div>
          </div>

          <div class="productos">
            ${productosVenta.map(producto => `
              <div class="producto">
                <div class="producto-nombre">${producto.descripcion}</div>
                <div class="producto-detalle">
                  <span>${producto.cantidad} x Q${Number(producto.precio_unitario).toFixed(2)}</span>
                  <span>Q${Number(producto.total).toFixed(2)}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="totales">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>Q${totalVenta.toFixed(2)}</span>
            </div>
            <div class="total-row final">
              <span>TOTAL:</span>
              <span>Q${totalVenta.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Efectivo:</span>
              <span>Q${efectivoNumero.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Cambio:</span>
              <span>Q${cambio.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>¡Gracias por su compra!</p>
            <p>Vuelva pronto</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Escribir contenido en la ventana
    ventanaImpresion.document.write(ticketHTML);
    ventanaImpresion.document.close();

    // Esperar a que cargue y luego imprimir
    ventanaImpresion.onload = () => {
      ventanaImpresion.focus();
      ventanaImpresion.print();
      // Cerrar ventana después de imprimir (opcional)
      // ventanaImpresion.close();
    };
  };

  // Confirmar venta y registrar en la base de datos
  const confirmarVenta = async () => {
    // Validaciones
    if (productosVenta.length === 0) {
      alert('No hay productos en la venta');
      return;
    }

    if (efectivoNumero < totalVenta) {
      alert('El efectivo ingresado es insuficiente');
      return;
    }

    try {
      // Obtener información del cajero
      const usuarioLogueado = localStorage.getItem('usuario');
      let idUsuario = null;
      let nombreCajero = '';
      if (usuarioLogueado) {
        const usuario = JSON.parse(usuarioLogueado);
        idUsuario = usuario.id_usuario;
        nombreCajero = usuario.nombre_usuario || '';
      }

      // Obtener fecha actual en zona horaria de Guatemala (UTC-6)
      const ahora = new Date();
      // Usar Intl.DateTimeFormat para obtener la fecha en zona horaria de Guatemala
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Guatemala',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      //const fecha_venta = formatter.format(ahora); // Formato YYYY-MM-DD
      
      // Preparar datos de la venta
      const ventaData = {
        id_usuario: idUsuario,
        nombre_cajero: nombreCajero,
        total: totalVenta,
        efectivo: efectivo,
        cambio: cambio,
        productos: productosVenta.map(p => ({
          id_producto: p.id_producto,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          total: p.total
        }))
      };

      // Enviar venta al backend
      const response = await fetch(`${API_URL}/api/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData)
      });

      const data = await response.json();

      if (response.ok) {
        // Limpiar la venta
        limpiarVentas();
        
        // ⭐ Disparar evento para actualizar notificaciones en tiempo real
        window.dispatchEvent(new Event('stockActualizado'));
      } else {
        alert(`❌ Error al registrar la venta: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al confirmar venta:', error);
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <div className="ventas-container">
      {/* Header */}
      <div className="ventas-header">
        <h1>💰 VENTAS CAJA</h1>
      </div>

      <div className="ventas-content">
        {/* Panel Izquierdo */}
        <div className="panel-izquierdo-ventas">
          {/* Input Código de Barras */}
          <div className="codigo-barras-section">
            <input
              ref={inputCodigoRef}
              type="text"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Código de barras"
              className="input-codigo-barras"
            />
            <button onClick={() => buscarProducto(codigoBarras)} className="btn-aceptar">
              Aceptar
            </button>
          </div>

          {/* Cantidad */}
          <div className="cantidad-section">
            <label>Cantidad:</label>
            <input
              type="number"
              value={cantidad || ""}
              onChange={(e) => setCantidad(e.target.value)}
              min="1"
              placeholder="1"
              className="input-cantidad"
            />
          </div>

          {/* Cajero */}
          <div className="cajero-section">
            <label>Cajero:</label>
            <input
              type="text"
              value={cajero}
              disabled
              className="input-cajero"
            />
          </div>

          {/* Imagen decorativa (opcional) */}
          <div className="imagen-decorativa">
            <p>🛒</p>
          </div>
        </div>

        {/* Panel Central - Tabla de Productos */}
        <div className="panel-central-ventas">
          <div className="tabla-ventas-container">
            <table className="tabla-ventas">
              <thead>
                <tr>
                  <th>Cant.</th>
                  <th>Descripción</th>
                  <th>Precio unit</th>
                  <th>Total</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {productosVenta.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2em' }}>
                      No hay productos en la venta
                    </td>
                  </tr>
                ) : (
                  productosVenta.map((producto) => (
                    <tr key={producto.id_producto}>
                      <td>
                        {modoEdicion ? (
                          <input
                            type="number"
                            value={producto.cantidad}
                            onChange={(e) => actualizarCantidad(producto.id_producto, e.target.value)}
                            min="1"
                            className="input-cantidad-editable"
                            placeholder="1"
                          />
                        ) : (
                          producto.cantidad
                        )}
                      </td>
                      <td>{producto.descripcion}</td>
                      <td>{Number(producto.precio_unitario).toFixed(2)}</td>
                      <td>{Number(producto.total).toFixed(2)}</td>
                      <td>
                        <button 
                          onClick={() => eliminarProducto(producto.id_producto)}
                          className="btn-eliminar-producto"
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="totales-section">
            <div className="total-item">
              <label>Efectivo</label>
              <input
                type="number"
                value={efectivo || ""}
                onChange={(e) => setEfectivo(e.target.value)}
                placeholder="0.00"
                className="input-efectivo"
              />
            </div>
            <div className="total-item">
              <label>Cambio</label>
              <input
                type="text"
                value={efectivo === "" ? "0.00" : cambio.toFixed(2)}
                disabled
                className="input-cambio"
              />
            </div>
            <div className="total-item">
              <label>Total</label>
              <input
                type="text"
                value={totalVenta.toFixed(2)}
                disabled
                className="input-total"
              />
            </div>
          </div>
        </div>

        {/* Panel Derecho - Botones */}
        <div className="panel-derecho-ventas">
          <button className="btn-ticket" onClick={imprimirTicket}>
            🎫 Factura
          </button>
          <button className="btn-confirmar-venta9" onClick={confirmarVenta}>
            ✅ Confirmar Venta
          </button>
          <button className="btn-buscar-producto" onClick={abrirModalBusqueda}>
            🔍 Buscar Producto
          </button>
          
          {!modoEdicion ? (
            <button className="btn-editar-ventas" onClick={activarModoEdicion}>
              ✏️ Editar Cantidad
            </button>
          ) : (
            <>
              <button className="btn-editar-ventas activo" onClick={guardarEdicion}>
                ✅ Guardar
              </button>
              <button className="btn-cancelar-edicion" onClick={cancelarEdicion}>
                ❌ Cancelar
              </button>
            </>
          )}
          
          <button className="btn-limpiar-ventas" onClick={limpiarVentas}>
            🧺Limpiar ventas
          </button>
          {esAdministrador && (
          <button className="btn-configuracion-header" onClick={abrirModalConfiguracion}>
            ⚙️ Configurar
          </button>
        )}
        <button className="btn-cerrar-caja" onClick={abrirModalCerrarCaja}>🗳️Cerrar caja</button>
        </div>
      </div>
      

      {/* Modal de Búsqueda de Productos */}
      {mostrarModalBusqueda && (
        <div className="modal-overlay-busqueda" onClick={cerrarModalBusqueda}>
          <div className="modal-busqueda-productos" onClick={(e) => e.stopPropagation()}>
            <div className="modal-busqueda-header">
              <h2>🔍 Buscar Producto</h2>
              <button className="btn-cerrar-modal" onClick={cerrarModalBusqueda}>✖</button>
            </div>

            {/* Barra de búsqueda */}
            <div className="modal-busqueda-barra">
              <input
                type="text"
                value={busquedaModal}
                onChange={(e) => handleBusquedaChange(e.target.value)}
                placeholder="Buscar por nombre o código de barras..."
                className="input-busqueda-modal"
                autoFocus
              />
              <div className="dropdown-categorias">
                <button 
                  className="btn-categorias-modal" 
                  onClick={() => setMostrarCategorias(!mostrarCategorias)}
                >
                  📁 {categoriaSeleccionada 
                    ? categorias.find(c => c.id_categoria === categoriaSeleccionada)?.nombre_categoria 
                    : 'Todas las categorías'}
                </button>
                {mostrarCategorias && (
                  <div className="dropdown-menu-categorias">
                    <div 
                      className={`dropdown-item ${categoriaSeleccionada === null ? 'activo' : ''}`}
                      onClick={() => seleccionarCategoria(null)}
                    >
                      Todas las categorías
                    </div>
                    {categorias.map(categoria => (
                      <div
                        key={categoria.id_categoria}
                        className={`dropdown-item ${categoriaSeleccionada === categoria.id_categoria ? 'activo' : ''}`}
                        onClick={() => seleccionarCategoria(categoria.id_categoria)}
                      >
                        {categoria.nombre_categoria}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn-limpiar-modal" onClick={limpiarBusquedaModal}>
                ✖ Limpiar
              </button>
            </div>

            {/* Tabla de productos */}
            <div className="modal-busqueda-tabla">
              <table className="tabla-productos-modal">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Precio Venta</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2em' }}>
                        No se encontraron productos
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((producto) => {
                      const stockDisponible = calcularStockDisponible(producto);
                      const productoEnVenta = productosVenta.find(p => p.id_producto === producto.id_producto);
                      
                      return (
                        <tr
                          key={producto.id_producto}
                          className={productoSeleccionadoModal?.id_producto === producto.id_producto ? 'fila-seleccionada' : ''}
                          onClick={() => seleccionarProductoModal(producto)}
                        >
                          <td>{producto.codigo_barras}</td>
                          <td>{producto.nombre_producto}</td>
                          <td>Q{Number(producto.precio_venta).toFixed(2)}</td>
                          <td>
                            {stockDisponible}
                            {productoEnVenta && (
                              <span style={{ 
                                fontSize: '0.85em', 
                                color: '#e74c3c', 
                                marginLeft: '0.5em',
                                fontWeight: 'bold'
                              }}>
                                ({productoEnVenta.cantidad} en venta)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Botones de acción */}
            <div className="modal-busqueda-footer">
              <button className="btn-aceptar-modal" onClick={aceptarProductoModal}>
                ✅ Aceptar
              </button>
              <button className="btn-cancelar-modal" onClick={cerrarModalBusqueda}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración del Negocio */}
      {mostrarModalConfiguracion && (
        <div className="modal-overlay-busqueda" onClick={cerrarModalConfiguracion}>
          <div className="modal-configuracion" onClick={(e) => e.stopPropagation()}>
            <div className="modal-busqueda-header">
              <h2>⚙️ Configuración del Negocio</h2>
              <button className="btn-cerrar-modal" onClick={cerrarModalConfiguracion}>✖</button>
            </div>

            <div className="admin-badge">
              <span>👤 Acceso: Administrador</span>
            </div>

            <div className="modal-configuracion-body">
              <div className="config-field">
                <label>Nombre del Negocio:</label>
                <input
                  type="text"
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                  placeholder="Ej: Tienda El Ahorro"
                  className="input-config"
                />
              </div>

              <div className="config-field">
                <label>Dirección (Opcional):</label>
                <input
                  type="text"
                  value={direccionNegocio}
                  onChange={(e) => setDireccionNegocio(e.target.value)}
                  placeholder="Ej: 5ta Avenida 10-50, Zona 1"
                  className="input-config"
                />
              </div>

              <div className="config-field">
                <label>Teléfono (Opcional):</label>
                <input
                  type="text"
                  value={telefonoNegocio}
                  onChange={(e) => setTelefonoNegocio(e.target.value)}
                  placeholder="Ej: 2234-5678"
                  className="input-config"
                />
              </div>

              <div className="config-info">
                <p>💡 Esta información aparecerá en las facturas de venta</p>
              </div>
            </div>

            <div className="modal-busqueda-footer">
              <button className="btn-aceptar-modal" onClick={guardarConfiguracion}>
                ✅ Guardar
              </button>
              <button className="btn-cancelar-modal" onClick={cerrarModalConfiguracion}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cerrar Caja */}
      {mostrarModalCerrarCaja && (
        <div className="modal-overlay-busqueda" onClick={cerrarModalCerrarCaja}>
          <div className="modal-cerrar-caja" onClick={(e) => e.stopPropagation()}>
            <div className="modal-busqueda-header">
              <h2>🗳️ Cerrar Caja</h2>
              <button className="btn-cerrar-modal" onClick={cerrarModalCerrarCaja}>✖</button>
            </div>

            <div className="modal-cerrar-caja-body">
              <div className="cerrar-caja-icono">
                <span style={{ fontSize: '80px' }}>💰</span>
              </div>
              
              <h3>¿Estás seguro de cerrar la caja?</h3>
              <p>Se generará un reporte con todas las ventas del día.</p>
              
              <div className="cerrar-caja-info">
                <p>📋 El reporte incluirá:</p>
                <ul>
                  <li>Total de ventas realizadas</li>
                  <li>Total de ingresos</li>
                  <li>Detalle de cada venta</li>
                  <li>Información del cajero</li>
                </ul>
              </div>

              <div className="cerrar-caja-advertencia">
                <p>⚠️ Asegúrate de haber completado todas las ventas pendientes</p>
              </div>
            </div>

            <div className="modal-busqueda-footer">
              <button className="btn-aceptar-modal" onClick={generarReporteCierre}>
                ✅ Generar Reporte y Cerrar
              </button>
              <button className="btn-cancelar-modal" onClick={cerrarModalCerrarCaja}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentasCaja;
