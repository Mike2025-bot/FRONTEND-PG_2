import { useState, useEffect } from "react";
import "./Proveedores.css";
import API_URL from "../../config";

interface Proveedor {
  id_proveedor?: number;
  nombre_proveedor: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  pais: string;
  valor: number;
  activo: boolean;
  fecha_registro?: string;
}

const Proveedores = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<number | null>(null);

  const [formulario, setFormulario] = useState<Proveedor>({
    nombre_proveedor: "",
    nit: "",
    telefono: "",
    email: "",
    direccion: "",
    ciudad: "",
    pais: "",
    valor: "" as any,
    activo: true,
  });

  // Cargar proveedores al iniciar
  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      setCargando(true);
      const res = await fetch(`${API_URL}/api/proveedores`);
      const data = await res.json();
      
      // Convertir valores numéricos correctamente
      const proveedoresFormateados = data.map((p: any) => ({
        ...p,
        valor: Number(p.valor || 0),
        activo: Boolean(p.activo)
      }));
      
      setProveedores(proveedoresFormateados);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    } finally {
      setCargando(false);
    }
  };

  const limpiarFormulario = () => {
    setFormulario({
      nombre_proveedor: "",
      nit: "",
      telefono: "",
      email: "",
      direccion: "",
      ciudad: "",
      pais: "",
      valor: "" as any,
      activo: true,
    });
    setProveedorSeleccionado(null);
  };

  // Función para eliminar proveedor
  const eliminarProveedor = async () => {
    if (!proveedorSeleccionado) {
      alert("Selecciona un proveedor para eliminar");
      return;
    }

    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres eliminar al proveedor "${formulario.nombre_proveedor}"?`
    );

    if (!confirmacion) return;

    try {
      const response = await fetch(`${API_URL}/api/proveedores/${proveedorSeleccionado}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Proveedor eliminado correctamente");
        limpiarFormulario();
        cargarProveedores();
      } else {
        const err = await response.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
      alert("Error de conexión con el servidor");
    }
  };

  const guardarProveedor = async () => {
    if (!formulario.nombre_proveedor) {
      alert("El nombre del proveedor es obligatorio");
      return;
    }

    try {
      const url = proveedorSeleccionado
        ? `${API_URL}/api/proveedores/${proveedorSeleccionado}`
        : `${API_URL}/api/proveedores`;
      
      const method = proveedorSeleccionado ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });

      if (response.ok) {
        alert(proveedorSeleccionado ? "Proveedor actualizado correctamente ✅" : "Proveedor creado correctamente ✅");
        limpiarFormulario();
        cargarProveedores();
      } else {
        const err = await response.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      alert("Error de conexión con el servidor");
    }
  };


  const proveedoresFiltrados = proveedores.filter((p) =>
    p.nombre_proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.nit?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.ciudad?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="usuarios-container">
      {/* Header */}
      <div className="usuarios-header">
        <h1>🚚PROVEEDORES</h1>
        <div className="header-buttons">
        </div>
      </div>

      <div className="usuarios-content">
        {/* Panel izquierdo: Lista de proveedores */}
        <div className="panel-izquierdoProve">
          <div className="busqueda-container">
            <input
              type="text"
              placeholder="🔍 Buscar proveedor por nombre, NIT o ciudad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-busqueda"
            />
            <button onClick={() => setBusqueda("")} className="btn-limpiarr">×</button>
          </div>

          <div className="tabla-usuarios">
  {cargando ? (
    <p>Cargando...</p>
  ) : proveedoresFiltrados.length === 0 ? (
    <p>No hay proveedores registrados</p>
  ) : (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre Proveedor</th>
          <th>NIT</th>
          <th>Teléfono</th>
          <th>Ciudad</th>
          <th>Valor</th>
          <th>Activo</th>
          <th>Fecha Registro</th>
        </tr>
      </thead>
      <tbody>
        {proveedoresFiltrados.map((p) => (
          <tr
            key={p.id_proveedor}
            className={proveedorSeleccionado === p.id_proveedor ? "seleccionado" : ""}
            onClick={() => {
              setFormulario({
                nombre_proveedor: p.nombre_proveedor,
                nit: p.nit || "",
                telefono: p.telefono || "",
                email: p.email || "",
                direccion: p.direccion || "",
                ciudad: p.ciudad || "",
                pais: p.pais || "",
                valor: p.valor || 0,
                activo: p.activo,
              });
              setProveedorSeleccionado(p.id_proveedor ?? null);
            }}
          >
            <td>{p.id_proveedor}</td>
            <td>{p.nombre_proveedor}</td>
            <td>{p.nit || "N/A"}</td>
            <td>{p.telefono || "N/A"}</td>
            <td>{p.ciudad || "N/A"}</td>
            <td>Q{(typeof p.valor === 'number' && !isNaN(p.valor) ? p.valor : 0).toFixed(2)}</td>
            <td>
              <span className={p.activo ? "badge-activo" : "badge-inactivo"}>
                {p.activo ? "Activo" : "Inactivo"}
              </span>
            </td>
            <td>{p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-GT') : "N/A"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>




        </div>

        {/* Panel derecho: Formulario */}
        <div className="panel-derechoProve">
          <div className="formulario">
            <label>Nombre del Proveedor *</label>
            <input
              type="text"
              value={formulario.nombre_proveedor}
              onChange={(e) => setFormulario({ ...formulario, nombre_proveedor: e.target.value })}
              placeholder="Ej: Multimayoreo Ipalteca, S.A."
            />

            <label>NIT</label>
            <input
              type="text"
              value={formulario.nit}
              onChange={(e) => setFormulario({ ...formulario, nit: e.target.value })}
              placeholder="Ej: 250105730"
            />

            <label>Teléfono</label>
            <input
              type="text"
              value={formulario.telefono}
              onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
              placeholder="Ej: 5551234567"
            />

            <label>Email</label>
            <input
              type="email"
              value={formulario.email}
              onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
              placeholder="Ej: ventas@proveedor.com"
            />

            <label>Dirección</label>
            <input
              type="text"
              value={formulario.direccion}
              onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
              placeholder="Ej: Zona 1"
            />

            <label>Ciudad</label>
            <input
              type="text"
              value={formulario.ciudad}
              onChange={(e) => setFormulario({ ...formulario, ciudad: e.target.value })}
              placeholder="Ej: Ciudad de Guatemala"
            />

            <label>País</label>
            <input
              type="text"
              value={formulario.pais}
              onChange={(e) => setFormulario({ ...formulario, pais: e.target.value })}
              placeholder="Ej: Guatemala"
            />

            <label>Valor</label>
            <input
              type="number"
              step="0.01"
              value={formulario.valor}
              onChange={(e) => setFormulario({ ...formulario, valor: e.target.value === "" ? "" as any : Number(e.target.value) })}
              placeholder="Ingrese el valor"
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', flexWrap: 'wrap' }}>
              <button onClick={guardarProveedor} className="btn-guardar">
                {proveedorSeleccionado ? "Actualizar" : "Guardar"}
              </button>
              <button onClick={eliminarProveedor} className="btn-eliminar">
                Eliminar
              </button>
              <button onClick={limpiarFormulario} className="btn-limpiar">
                Limpiar
              </button>
              <input
                type="checkbox"
                checked={formulario.activo}
                onChange={(e) => setFormulario({ ...formulario, activo: e.target.checked })}
                style={{ width: 'auto', margin: 0 }}
              />
              <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Activo</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proveedores;
