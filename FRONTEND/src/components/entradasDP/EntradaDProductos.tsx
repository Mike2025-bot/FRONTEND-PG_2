import { useState, useEffect } from "react";
import "./EntradaDProductos.css";
import API_URL from "../../config";

interface Producto {
  id_producto: number;
  nombre_producto: string;
  id_categoria: number;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
}

const EntradaDProductos = () => {
  // Estados principales
  const [todosProductos, setTodosProductos] = useState<Producto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosCoincidentes, setProductosCoincidentes] = useState<number[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  const [categorias, setCategorias] = useState<{ id_categoria: number; nombre_categoria: string }[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | "">("");


  const [formulario, setFormulario] = useState({
    id_producto: 0,
    cantidad: "" as number | "",
    precio_unitario: 0,
  });

  // Función para cargar producto a reponer
  const cargarProductoAReponer = (producto: any) => {
    // Cargar el producto en el formulario
    setProductoSeleccionado({
      id_producto: producto.id_producto,
      nombre_producto: producto.nombre_producto,
      id_categoria: producto.id_categoria || 0,
      precio_compra: producto.precio_compra || 0,
      precio_venta: producto.precio_venta || 0,
      stock_actual: producto.stock_actual || 0,
      stock_minimo: producto.stock_minimo || 0,
      stock_maximo: producto.stock_maximo || 0
    });
    
    setFormulario({
      id_producto: producto.id_producto,
      cantidad: producto.cantidad_sugerida > 0 ? producto.cantidad_sugerida : "",
      precio_unitario: producto.precio_compra || 0
    });
    
    // NO actualizar búsqueda para mantener todos los productos visibles
    // setBusqueda(producto.nombre_producto);
  };

  // Función para actualizar stock del producto seleccionado
  const actualizarStockProductoSeleccionado = async () => {
    if (productoSeleccionado) {
      try {
        const response = await fetch(`${API_URL}/api/productos`);
        const productos = await response.json();
        const productoActualizado = productos.find((p: any) => p.id_producto === productoSeleccionado.id_producto);
        
        if (productoActualizado) {
          setProductoSeleccionado({
            ...productoSeleccionado,
            stock_actual: productoActualizado.stock_actual,
            stock_minimo: productoActualizado.stock_minimo,
            stock_maximo: productoActualizado.stock_maximo
          });
        }
      } catch (error) {
        console.error("Error al actualizar stock:", error);
      }
    }
  };

  // Cargar productos
  useEffect(() => {
    cargarProductos();
    
    // Verificar si hay un producto a reponer desde InventarioP o Navbar
    const productoAReponer = localStorage.getItem('productoAReponer');
    if (productoAReponer) {
      const producto = JSON.parse(productoAReponer);
      cargarProductoAReponer(producto);
      
      // Limpiar el localStorage después de cargar
      localStorage.removeItem('productoAReponer');
    }

    // Escuchar evento personalizado para cambios dinámicos
    const handleProductoActualizado = (event: any) => {
      const producto = event.detail;
      cargarProductoAReponer(producto);
    };

    window.addEventListener('productoAReponerActualizado', handleProductoActualizado);

    // Cleanup
    return () => {
      window.removeEventListener('productoAReponerActualizado', handleProductoActualizado);
    };
  }, []);

  // ⭐ Actualizar stock en tiempo real cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      actualizarStockProductoSeleccionado();
    }, 5000); // 5 segundos

    return () => clearInterval(interval);
  }, [productoSeleccionado]);

  // ⭐ Escuchar evento de actualización de stock
  useEffect(() => {
    const handleStockActualizado = () => {
      actualizarStockProductoSeleccionado();
    };

    window.addEventListener('stockActualizado', handleStockActualizado);

    return () => {
      window.removeEventListener('stockActualizado', handleStockActualizado);
    };
  }, [productoSeleccionado]);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const response = await fetch(`${API_URL}/api/productos`);
      const data = await response.json();
      setTodosProductos(data);
      setProductos(data); // Mostrar todos inicialmente
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setCargando(false);
    }
  };

  // --------------------------------------------------------------------------------------
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categorias`);
        const data = await response.json();
        setCategorias(data);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };

    cargarCategorias();
  }, []);

  const filtrarPorCategoria = (idCategoria: number | "") => {
    setCategoriaSeleccionada(idCategoria);

    if (idCategoria === "" || idCategoria === 0) {
      setProductos(todosProductos);
      return;
    }

    const filtrados = todosProductos.filter((p) => p.id_categoria === idCategoria);
    setProductos(filtrados);
  };

  // 🔍 Filtrado en tiempo real
  useEffect(() => {
    if (busqueda.trim() === "") {
      setProductos(todosProductos);
      setProductosCoincidentes([]);
    } else {
      const filtrados = todosProductos.filter((p) =>
        p.nombre_producto.toLowerCase().includes(busqueda.toLowerCase())
      );
      setProductos(filtrados);

      const coincidenciasExactas = filtrados
        .filter((p) => p.nombre_producto.toLowerCase() === busqueda.toLowerCase())
        .map((p) => p.id_producto);

      setProductosCoincidentes(coincidenciasExactas);
    }
  }, [busqueda, todosProductos]);

  const limpiarFormulario = () => {
    setFormulario({ id_producto: 0, cantidad: "", precio_unitario: 0 });
    setProductoSeleccionado(null);
  };

  const guardarEntrada = async () => {
    if (!formulario.id_producto || !formulario.cantidad || Number(formulario.cantidad) <= 0 || formulario.precio_unitario <= 0) {
      alert("Todos los campos son obligatorios y deben ser mayores a 0");
      return;
    }

    try {
      // Obtener información del usuario logueado
      const usuarioLogueado = localStorage.getItem('usuario');
      let datosUsuario = null;
      if (usuarioLogueado) {
        datosUsuario = JSON.parse(usuarioLogueado);
      }

      // Agregar información del usuario al formulario
      const datosEnviar = {
        ...formulario,
        id_usuario: datosUsuario?.id_usuario || null,
        nombre_usuario: datosUsuario?.nombre_usuario || null
      };

      const response = await fetch(`${API_URL}/api/entradas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosEnviar),
      });

      if (response.ok) {
        alert("Entrada registrada correctamente");
        
        // ⭐ Actualizar el stock del producto seleccionado inmediatamente
        if (productoSeleccionado) {
          setProductoSeleccionado({
            ...productoSeleccionado,
            stock_actual: productoSeleccionado.stock_actual + Number(formulario.cantidad)
          });
        }
        
        // Limpiar formulario pero mantener el producto seleccionado
        setFormulario({ 
          id_producto: productoSeleccionado?.id_producto || 0, 
          cantidad: "", 
          precio_unitario: productoSeleccionado?.precio_compra || 0 
        });
        
        // ⭐ Disparar evento para actualizar notificaciones en tiempo real
        window.dispatchEvent(new Event('stockActualizado'));
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error al guardar entrada:", error);
      alert("Error al registrar la entrada");
    }
  };

  return (
    <div className="entradas-productos">
      {/* Header */}
      <div className="entradas-header">
        <h1>🛒ENTRADA DE PRODUCTOS</h1>
        <div className="header-buttons">
        </div>
      </div>

      <div className="entradas-content">
        {/* Panel izquierdo - lista de productos */}
        <div className="panel-izquierdo1">
          <div className="busqueda-container">
            <input
              type="text"
              placeholder="🔍 Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-busqueda"
            />

            <select
              value={categoriaSeleccionada}
              onChange={(e) => filtrarPorCategoria(Number(e.target.value) || "")}
              className="select-categoria"
            >
              <option value="">🔽 T/Categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre_categoria}
                </option>
              ))}
            </select>

            <button onClick={() => {
              setBusqueda("");
              filtrarPorCategoria("");
            }} className="btn-limpiar">
              ×
            </button>
            <button
              onClick={() => {
                const filtrados = todosProductos.filter((p) =>
                  p.nombre_producto.toLowerCase().includes(busqueda.toLowerCase())
                );
                setProductos(filtrados);
              }}
              className="btn-buscar"
            >
              Buscar
            </button>
          </div>

          <div className="lista-productos">
            {cargando ? (
              <p>Cargando...</p>
            ) : productos.length === 0 ? (
              <p>No hay productos</p>
            ) : (
              productos.map((p) => (
                <div
                  key={p.id_producto}
                  className={`item-producto ${productoSeleccionado?.id_producto === p.id_producto
                      ? "seleccionado"
                      : productosCoincidentes.includes(p.id_producto)
                        ? "resaltado"
                        : ""
                    }`}
                  onClick={() => {
                    setProductoSeleccionado(p);
                    // Cargar automáticamente el precio_compra del producto
                    setFormulario({ 
                      id_producto: p.id_producto, 
                      cantidad: "", // Campo vacío listo para ingresar
                      precio_unitario: p.precio_compra || 0 
                    });
                    // NO actualizar búsqueda para mantener la lista visible
                    // setBusqueda(p.nombre_producto);
                  }}
                >
                  {p.nombre_producto}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho - formulario */}
        <div className="panel-derechoEP">
          <div className="formulario">
            <label>Producto seleccionado:</label>
            <input type="text" value={productoSeleccionado?.nombre_producto || ""} disabled />

            <label>📦 Stock actual en inventario</label>
            <input 
              type="text" 
              value={productoSeleccionado ? `${productoSeleccionado.stock_actual} unidades` : "Selecciona un producto"} 
              disabled 
              style={{ 
                background: (productoSeleccionado?.stock_actual ?? 0) <= (productoSeleccionado?.stock_minimo ?? 0) 
                  ? '#fee2e2' 
                  : '#d1fae5',
                color: (productoSeleccionado?.stock_actual ?? 0) <= (productoSeleccionado?.stock_minimo ?? 0) 
                  ? '#991b1b' 
                  : '#065f46',
                fontWeight: 'bold'
              }}
            />

            <label>Cantidad a ingresar</label>
            <input
              type="number"
              value={formulario.cantidad}
              onChange={(e) => setFormulario({ ...formulario, cantidad: Number(e.target.value) })}
            />

            <label>Precio unitario</label>
            <input
              type="number"
              value={formulario.precio_unitario}
              onChange={(e) =>
                setFormulario({ ...formulario, precio_unitario: Number(e.target.value) })
              }
            />

            <label>Total</label>
            <input
              type="number"
              value={formulario.cantidad ? Number(formulario.cantidad) * formulario.precio_unitario : 0}
              disabled
            />

            <button onClick={guardarEntrada} className="btn-guardar">
              Agregar Entrada
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

export default EntradaDProductos;
