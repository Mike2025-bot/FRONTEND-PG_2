import { useState, useEffect } from "react";
import "./Categorias.css";
import API_URL from "../../config";

interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
}

const Categorias = () => {
  // Estados principales
  const [todasCategorias, setTodasCategorias] = useState<Categoria[]>([]);
  const [categoriasCoincidentes, setCategoriasCoincidentes] = useState<number[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  // Estado del formulario
  const [formulario, setFormulario] = useState({
    nombre_categoria: "",
  });

  // Cargar categorías al montar el componente
  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setCargando(true);
      const response = await fetch(`${API_URL}/api/categorias`);
      const data = await response.json();
      setTodasCategorias(data);
      setCategorias(data); // Se muestran todas inicialmente
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    } finally {
      setCargando(false);
    }
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setFormulario({ nombre_categoria: "" });
    setCategoriaSeleccionada(null);
  };

  // Guardar o actualizar categoría
  const guardarCategoria = async () => {
    if (!formulario.nombre_categoria.trim()) {
      alert("El nombre de la categoría no puede estar vacío");
      return;
    }

    try {
      const url = categoriaSeleccionada
        ? `${API_URL}/api/categorias/${categoriaSeleccionada.id_categoria}`
        : `${API_URL}/api/categorias`;
      const method = categoriaSeleccionada ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_categoria: formulario.nombre_categoria }),
      });

      if (response.ok) {
        alert(
          categoriaSeleccionada
            ? "Categoría actualizada correctamente"
            : "Categoría creada correctamente"
        );
        cargarCategorias();
        limpiarFormulario();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      alert("Error al guardar categoría");
    }
  };

  // Eliminar categoría
  const eliminarCategoria = async (categoria: Categoria) => {
    if (
      !confirm(
        `¿Está seguro de eliminar la categoría "${categoria.nombre_categoria}"?`
      )
    )
      return;

    try {
      const response = await fetch(
        `${API_URL}/api/categorias/${categoria.id_categoria}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        alert("Categoría eliminada correctamente");
        cargarCategorias();
        if (categoriaSeleccionada?.id_categoria === categoria.id_categoria)
          limpiarFormulario();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error al eliminar la categoría");
      }
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      alert("Error de conexión al eliminar la categoría");
    }
  };

  // 🔍 Filtrado en tiempo real
  useEffect(() => {
  if (busqueda.trim() === "") {
    setCategorias(todasCategorias); //mostrar todas si la búsqueda está vacía
    setCategoriasCoincidentes([]); // no resalta nada
  } else {
    const filtradas = todasCategorias.filter((c) =>
      c.nombre_categoria.toLowerCase().includes(busqueda.toLowerCase())
    );
    setCategorias(filtradas);

    const coincidenciasExactas = filtradas
    .filter((c) => c.nombre_categoria.toLowerCase() === busqueda.toLowerCase())
    .map((c) => c.id_categoria);

    setCategoriasCoincidentes(coincidenciasExactas);
  }
}, [busqueda, todasCategorias]);


  return (
    <div className="categorias">
      {/* Header */}
      <div className="categorias-header">
        <h1>🏷️CATEGORÍAS</h1>
        <div className="header-buttons">
        </div>
      </div>

      <div className="categorias-content">
        {/* Panel izquierdo - lista y búsqueda */}
        <div className="panel-izquierdocat">
          <div className="busqueda-container">
            <input
              type="text"
              placeholder="🔍Buscar categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-busqueda"
            />
            <button onClick={() => setBusqueda("")} className="btn-limpiar">
              ×
            </button>
            <button
              onClick={() => {
                const filtradas = todasCategorias.filter((c) =>
                  c.nombre_categoria.toLowerCase().includes(busqueda.toLowerCase())
                );
                setCategorias(filtradas);
              }}
              className="btn-buscar"
            >
              Buscar
            </button>
          </div>

          <div className="lista-categorias">
            {cargando ? (
              <div>Cargando...</div>
            ) : categorias.length === 0 ? (
              <div>No hay categorías</div>
            ) : (
              categorias.map((c) => (
                <div
                  key={c.id_categoria}
                  className={`item-categoria ${
                    categoriaSeleccionada?.id_categoria === c.id_categoria
                      ? "seleccionado"
                      : categoriasCoincidentes.includes(c.id_categoria)
                      ? "resaltado"
                      : ""
                  }`}
                  onClick={() => {
                    setCategoriaSeleccionada(c);
                    setFormulario({ nombre_categoria: c.nombre_categoria });
                  }}
                >
                  {c.nombre_categoria}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarCategoria(c);
                    }}
                    className="btn-eliminar"
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho - formulario */}
        <div className="panel-derecho1">
          <div className="formulario">
            <label>Nombre de la categoría</label>
            <input
              type="text"
              value={formulario.nombre_categoria}
              onChange={(e) =>
                setFormulario({ nombre_categoria: e.target.value })
              }
            />
            <button onClick={guardarCategoria} className="btn-guardar">
              {categoriaSeleccionada ? "Actualizar" : "Agregar"}
            </button>
            <button onClick={limpiarFormulario} className="btn-limpiar">
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categorias;