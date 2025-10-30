import { useState, useEffect } from "react";
import "./MovimeintosP.css";
import API_URL from "../../config";

interface Movimiento {
  id_movimiento: number;
  id_producto: number;
  nombre_producto: string;
  fecha: string; // Puede venir como '2025-10-29' o '2025-10-29T00:00:00.000Z'
  tipo_movimiento: "ENTRADA" | "SALIDA";
  cantidad: number;
  stock_resultante: number;
  origen_movimiento: "ENTRADA" | "SALIDA" | "AJUSTE_INVENTARIO";
  id_usuario: number;
  nombre_usuario: string;
}

const MovimientosP = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [movimientosOriginales, setMovimientosOriginales] = useState<Movimiento[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [cargando, setCargando] = useState(false);

  // 🔧 Función para normalizar fechas (convertir a formato YYYY-MM-DD)
  const normalizarFecha = (fechaString: string): string => {
    if (!fechaString) return '';
    
    // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaString)) {
      return fechaString;
    }
    
    // Si tiene formato ISO (con Z o timezone), extraer solo la parte de la fecha
    if (fechaString.includes('T')) {
      return fechaString.split('T')[0];
    }
    
    // Para cualquier otro caso, usar Date y formatear
    const fecha = new Date(fechaString);
    return fecha.toISOString().split('T')[0];
  };

  // 🔧 Función para formatear fecha para mostrar (sin cambiar zona horaria)
  const formatearFechaParaMostrar = (fechaString: string): string => {
    const fechaNormalizada = normalizarFecha(fechaString);
    const [year, month, day] = fechaNormalizada.split('-');
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    cargarMovimientos();
  }, []);

  // 🔍 Búsqueda automática en tiempo real
  useEffect(() => {
    if (movimientosOriginales.length === 0) return;

    if (busqueda.trim() === "") {
      setMovimientos(movimientosOriginales);
      return;
    }

    const busquedaLower = busqueda.toLowerCase().trim();

    const filtrados = movimientosOriginales.filter((m) => {
      try {
        const id = m.id_movimiento?.toString() || "";
        const producto = m.nombre_producto?.toLowerCase() || "";
        const usuario = m.nombre_usuario?.toLowerCase() || "";
        const origen = m.origen_movimiento?.toLowerCase() || "";
        const tipo = m.tipo_movimiento?.toLowerCase() || "";
        const cantidad = m.cantidad?.toString() || "";
        const stock = m.stock_resultante?.toString() || "";

        return (
          id.includes(busquedaLower) ||
          producto.includes(busquedaLower) ||
          usuario.includes(busquedaLower) ||
          origen.includes(busquedaLower) ||
          tipo.includes(busquedaLower) ||
          cantidad.includes(busquedaLower) ||
          stock.includes(busquedaLower)
        );
      } catch (error) {
        console.error("Error al filtrar movimiento:", error);
        return false;
      }
    });

    setMovimientos(filtrados);
  }, [busqueda, movimientosOriginales]);

  const cargarMovimientos = async () => {
    try {
      setCargando(true);
      console.log("🔄 Cargando movimientos desde:", `${API_URL}/api/movimientos`);
      
      const response = await fetch(`${API_URL}/api/movimientos`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Normalizar las fechas en los datos recibidos
      const datosNormalizados = data.map((movimiento: Movimiento) => ({
        ...movimiento,
        fecha: normalizarFecha(movimiento.fecha)
      }));
      
      console.log("✅ Datos recibidos y normalizados:", datosNormalizados);
      
      // Mostrar fechas únicas ordenadas (después de normalizar)
      const fechasUnicas = [...new Set(datosNormalizados.map((m: Movimiento) => m.fecha))].sort();
      console.log("📅 Fechas únicas en movimientos (normalizadas):", fechasUnicas);
      
      // Verificar específicamente el 29/10/2025
      const movimientos29 = datosNormalizados.filter((m: Movimiento) => m.fecha === '2025-10-29');
      console.log(`🔍 Movimientos del 2025-10-29: ${movimientos29.length}`, movimientos29);

      // Ordenar por fecha más reciente primero
      const datosOrdenados = datosNormalizados.sort((a: Movimiento, b: Movimiento) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      
      setMovimientos(datosOrdenados);
      setMovimientosOriginales(datosOrdenados);
      
    } catch (error) {
      console.error("❌ Error al cargar movimientos:", error);
    } finally {
      setCargando(false);
    }
  };

  // 📅 Filtrar por rango de fechas (USANDO EL ENDPOINT DEL BACKEND)
  const filtrarPorFechas = async () => {
    if (!fechaInicio || !fechaFin) {
      alert("⚠️ Debes seleccionar ambas fechas (inicio y fin)");
      return;
    }

    if (fechaInicio > fechaFin) {
      alert("⚠️ La fecha de inicio no puede ser mayor a la fecha fin");
      return;
    }

    try {
      setCargando(true);
      console.log("🎯 Solicitando filtro al backend...", { fechaInicio, fechaFin });

      const response = await fetch(`${API_URL}/api/movimientos/filtrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fechaInicio,
          fechaFin
        }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Normalizar las fechas en los datos filtrados
      const datosNormalizados = data.map((movimiento: Movimiento) => ({
        ...movimiento,
        fecha: normalizarFecha(movimiento.fecha)
      }));
      
      console.log(`✅ Filtro completado: ${datosNormalizados.length} movimientos encontrados`);
      console.log("📋 Movimientos filtrados:", datosNormalizados.map(m => ({
        id: m.id_movimiento,
        fecha: m.fecha,
        producto: m.nombre_producto
      })));
      
      if (datosNormalizados.length === 0) {
        alert("No se encontraron movimientos en el rango de fechas seleccionado");
      }

      setMovimientos(datosNormalizados);
      
    } catch (error) {
      console.error("❌ Error al filtrar movimientos:", error);
      alert("Error al filtrar movimientos");
    } finally {
      setCargando(false);
    }
  };

  // 🔄 Limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda("");
    setFechaInicio("");
    setFechaFin("");
    setMovimientos(movimientosOriginales);
    console.log("🔄 Filtros limpiados");
  };

  // 🗑️ Eliminar movimientos por rango de fechas
  const eliminarMovimientosPorFecha = async () => {
    if (!fechaInicio || !fechaFin) {
      alert("⚠️ Debes seleccionar ambas fechas (inicio y fin) para eliminar");
      return;
    }

    // Primero obtenemos los movimientos en el rango usando el filtro del backend
    try {
      setCargando(true);
      const response = await fetch(`${API_URL}/api/movimientos/filtrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fechaInicio,
          fechaFin
        }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Normalizar las fechas
      const movimientosEnRango = data.map((movimiento: Movimiento) => ({
        ...movimiento,
        fecha: normalizarFecha(movimiento.fecha)
      }));

      if (movimientosEnRango.length === 0) {
        alert("⚠️ No hay movimientos en el rango de fechas seleccionado");
        return;
      }

      // Confirmación antes de eliminar
      const confirmar = window.confirm(
        `¿Estás seguro de que deseas eliminar ${movimientosEnRango.length} movimiento(s) desde ${fechaInicio} hasta ${fechaFin}? Esta acción no se puede deshacer.`
      );

      if (!confirmar) return;

      let eliminados = 0;
      let errores = 0;

      for (const movimiento of movimientosEnRango) {
        try {
          const deleteResponse = await fetch(`${API_URL}/api/movimientos/${movimiento.id_movimiento}`, {
            method: "DELETE",
          });

          if (deleteResponse.ok) eliminados++;
          else errores++;
        } catch (error) {
          console.error(`Error al eliminar movimiento ${movimiento.id_movimiento}:`, error);
          errores++;
        }
      }

      if (eliminados > 0) {
        alert(`✅ Se eliminaron ${eliminados} movimiento(s) correctamente${errores > 0 ? `\n❌ ${errores} error(es)` : ""}`);
        cargarMovimientos();
        limpiarFiltros();
      } else {
        alert("❌ No se pudo eliminar ningún movimiento");
      }
    } catch (error) {
      console.error("Error al eliminar movimientos:", error);
      alert("❌ Error al eliminar movimientos");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="movimientos-productos">
      <div className="movimientos-header">
        <h1>🔄 REGISTRO DE MOVIMIENTO DE PRODUCTOS</h1>
      </div>

      <div className="movimientos-content">
        <div className="panel-derechoMov">
          {/* Filtros y búsqueda */}
          <div className="filtros-container">
            <div className="busqueda-container">
              <input
                type="text"
                placeholder="🔍 Buscar por ID, producto, origen, usuario, cantidad o stock..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-busqueda"
                disabled={cargando}
              />
              {busqueda && (
                <button 
                  onClick={() => setBusqueda("")} 
                  className="btn-limpiar-busqueda"
                  disabled={cargando}
                >
                  ×
                </button>
              )}
            </div>

            <div className="filtros-fecha">
              <div className="fecha-grupo">
                <label>📅 Fecha Inicio:</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="input-fecha"
                  disabled={cargando}
                />
              </div>
              <div className="fecha-grupo">
                <label>📅 Fecha Fin:</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="input-fecha"
                  disabled={cargando}
                />
              </div>
              <button 
                onClick={filtrarPorFechas} 
                className="btn-filtrar"
                disabled={cargando}
              >
                {cargando ? "⏳ Filtrando..." : "🔍 Filtrar"}
              </button>
              <button 
                onClick={limpiarFiltros} 
                className="btn-limpiar-filtros"
                disabled={cargando}
              >
                🔄 Limpiar Filtros
              </button>
              <button 
                onClick={eliminarMovimientosPorFecha} 
                className="btn-eliminar-rango"
                disabled={cargando}
              >
                🗑️ Eliminar Rango
              </button>
            </div>
          </div>

          {/* 🧾 Historial */}
          <h2>Historial de Movimientos ({movimientos.length}) {cargando && "⏳ Cargando..."}</h2>
          <div className="tabla-scroll">
            <table className="tabla-movimientos">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Fecha</th>
                  <th>Origen</th>
                  <th>Usuario</th>
                  <th>Cantidad</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2em" }}>
                      ⏳ Cargando movimientos...
                    </td>
                  </tr>
                ) : movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2em" }}>
                      No hay movimientos registrados
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => (
                    <tr key={m.id_movimiento}>
                      <td>{m.id_movimiento}</td>
                      <td>{m.nombre_producto}</td>
                      {/* Usar la función de formateo que no afecta la zona horaria */}
                      <td>{formatearFechaParaMostrar(m.fecha)}</td>
                      <td>
                        <span className={`texto-origen ${m.tipo_movimiento.toLowerCase()}`}>
                          {m.origen_movimiento}
                        </span>
                      </td>
                      <td>{m.nombre_usuario}</td>
                      <td>{m.cantidad}</td>
                      <td>{m.stock_resultante}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovimientosP;
