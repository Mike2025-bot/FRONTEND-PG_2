import { useState, useEffect } from "react";
import "./MovimeintosP.css";
import API_URL from "../../config";

interface Movimiento {
  id_movimiento: number;
  id_producto: number;
  nombre_producto: string;
  fecha: string;
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

  useEffect(() => {
    cargarMovimientos();
  }, []);

  // Búsqueda automática en tiempo real
  useEffect(() => {
    // Si no hay datos originales, no hacer nada
    if (movimientosOriginales.length === 0) {
      return;
    }

    // Si no hay búsqueda, mostrar todos
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
      const response = await fetch(`${API_URL}/api/movimientos`);
      const data = await response.json();
      setMovimientos(data);
      setMovimientosOriginales(data); // Guardar copia original para filtros
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
    }
  };

  // Función para filtrar por rango de fechas
  const filtrarPorFechas = () => {
    if (!fechaInicio || !fechaFin) {
      alert("⚠️ Debes seleccionar ambas fechas (inicio y fin)");
      return;
    }

    // Crear fechas en hora local (no UTC)
    const [yearInicio, mesInicio, diaInicio] = fechaInicio.split('-').map(Number);
    const [yearFin, mesFin, diaFin] = fechaFin.split('-').map(Number);
    
    const inicio = new Date(yearInicio, mesInicio - 1, diaInicio, 0, 0, 0, 0);
    const fin = new Date(yearFin, mesFin - 1, diaFin, 23, 59, 59, 999);

    if (inicio > fin) {
      alert("⚠️ La fecha de inicio no puede ser mayor a la fecha fin");
      return;
    }

    const filtrados = movimientosOriginales.filter((m) => {
      const fechaMovimiento = new Date(m.fecha);
      return fechaMovimiento >= inicio && fechaMovimiento <= fin;
    });

    setMovimientos(filtrados);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda("");
    setFechaInicio("");
    setFechaFin("");
    setMovimientos(movimientosOriginales);
  };

  // Función para eliminar movimientos por rango de fechas
  const eliminarMovimientosPorFecha = async () => {
    if (!fechaInicio || !fechaFin) {
      alert("⚠️ Debes seleccionar ambas fechas (inicio y fin) para eliminar");
      return;
    }

    // Crear fechas en hora local (no UTC)
    const [yearInicio, mesInicio, diaInicio] = fechaInicio.split('-').map(Number);
    const [yearFin, mesFin, diaFin] = fechaFin.split('-').map(Number);
    
    const inicio = new Date(yearInicio, mesInicio - 1, diaInicio, 0, 0, 0, 0);
    const fin = new Date(yearFin, mesFin - 1, diaFin, 23, 59, 59, 999);

    if (inicio > fin) {
      alert("⚠️ La fecha de inicio no puede ser mayor a la fecha fin");
      return;
    }

    // Obtener movimientos en el rango
    const movimientosEnRango = movimientosOriginales.filter((m) => {
      const fechaMovimiento = new Date(m.fecha);
      return fechaMovimiento >= inicio && fechaMovimiento <= fin;
    });

    if (movimientosEnRango.length === 0) {
      alert("⚠️ No hay movimientos en el rango de fechas seleccionado");
      return;
    }

    try {
      // Eliminar cada movimiento
      let eliminados = 0;
      let errores = 0;

      for (const movimiento of movimientosEnRango) {
        try {
          const response = await fetch(
            `${API_URL}/api/movimientos/${movimiento.id_movimiento}`,
            { method: "DELETE" }
          );

          if (response.ok) {
            eliminados++;
          } else {
            errores++;
          }
        } catch (error) {
          console.error(`Error al eliminar movimiento ${movimiento.id_movimiento}:`, error);
          errores++;
        }
      }

      if (eliminados > 0) {
        alert(`✅ Se eliminaron ${eliminados} movimiento(s) correctamente${errores > 0 ? `\n❌ ${errores} error(es)` : ""}`);
        cargarMovimientos(); // Recargar la lista
        limpiarFiltros(); // Limpiar filtros
      } else {
        alert("❌ No se pudo eliminar ningún movimiento");
      }
    } catch (error) {
      console.error("Error al eliminar movimientos:", error);
      alert("❌ Error al eliminar movimientos");
    }
  };

  return (
    <div className="movimientos-productos">
      {/* Header */}
      <div className="movimientos-header">
        <h1>🔄REGISTRO DE MOVIMIENTO DE PRODUCTOS</h1>
        <div className="header-buttons">
        </div>
      </div>

      <div className="movimientos-content">
        {/* Panel derecho - formulario */}
        <div className="panel-derechoMov">
          
          {/* Buscador y filtros */}
          <div className="filtros-container">
            {/* Buscador inteligente */}
            <div className="busqueda-container">
              <input
                type="text"
                placeholder="🔍 Buscar por ID, producto, origen, usuario, cantidad o stock..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-busqueda"
              />
              {busqueda && (
                <button onClick={() => setBusqueda("")} className="btn-limpiar-busqueda">
                  ×
                </button>
              )}
            </div>

            {/* Filtros por fecha */}
            <div className="filtros-fecha">
              <div className="fecha-grupo">
                <label>📅 Fecha Inicio:</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="input-fecha"
                />
              </div>
              <div className="fecha-grupo">
                <label>📅 Fecha Fin:</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="input-fecha"
                />
              </div>
              <button onClick={filtrarPorFechas} className="btn-filtrar">
                🔍 Filtrar
              </button>
              <button onClick={limpiarFiltros} className="btn-limpiar-filtros">
                🔄 Limpiar Filtros
              </button>
              <button onClick={eliminarMovimientosPorFecha} className="btn-eliminar-rango">
                🗑️ Eliminar Rango
              </button>
            </div>
          </div>

          {/* Historial de movimientos */}
          <h2>Historial de Movimientos ({movimientos.length})</h2>
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
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2em' }}>
                      No hay movimientos registrados
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => (
                    <tr key={m.id_movimiento}>
                      <td>{m.id_movimiento}</td>
                      <td>{m.nombre_producto}</td>
                      <td>{new Date(m.fecha).toLocaleString('es-GT')}</td>
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
