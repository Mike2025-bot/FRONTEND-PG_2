import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './InventarioP.css';
import API_URL from '../../config';

interface Producto {
  id_producto: number;
  codigo_barras: string;
  nombre_producto: string;
  id_categoria: number;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;

  // ✅ Campos adicionales opcionales
  stock_minimo?: number;
  stock_maximo?: number;
  id_proveedor?: number;  // ✅ Cambiado de string a number
  referencia?: string;
  notas?: string;
  foto?: number;
}

interface Proveedor {
  id_proveedor: number;
  nombre_proveedor: string;
  activo: boolean;
}


/*interface Movimiento {
  id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
  motivo: string;
}*/

const InventariosP = () => {
  const navigate = useNavigate();
  
  // Ref para el input de código de barras
  const inputCodigoBarrasRef = useRef<HTMLInputElement>(null);
  
  // Estados principales
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarModalEscaneo, setMostrarModalEscaneo] = useState(false);
  const [codigoEscaneado, setCodigoEscaneado] = useState('');
  const [categorias, setCategorias] = useState<{ id_categoria: number, nombre_categoria: string }[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productosOriginales, setProductosOriginales] = useState<Producto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | "">("");
  // Agregar estado para mensaje de errores
  const [errorCampos, setErrorCampos] = useState<string>("");
  const [mostrarModalErrorCampos, setMostrarModalErrorCampos] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [esNuevo, setEsNuevo] = useState(false);


  // Estados del modal
  const [mostrarModalEliminarMovimientos, setMostrarModalEliminarMovimientos] = useState(false);
  const [mesesConservar, setMesesConservar] = useState<number>(0);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  const handleEliminarMovimientos = async () => {
    // Validación básica
    if (!mesesConservar && !fechaInicio && !fechaFin) {
      alert("Ingresa 0 o un número positivo");
      return;
    } if (mesesConservar < 0) {
      alert("El número de meses debe ser 0 o positivo");
      return;
    } if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      alert("La fecha de inicio no puede ser mayor a la fecha fin");
      return;
    }

    try {
      // API
      const response = await fetch(`${API_URL}/api/productos/eliminar-movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mesesConservar,
          fechaInicio,
          fechaFin
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Movimientos eliminados correctamente: ${data.eliminados}`);
        setMostrarModalEliminarMovimientos(false);
        setMesesConservar(0);
        setFechaInicio('');
        setFechaFin('');
      } else {
        alert("Error al eliminar movimientos");
      }
    } catch (error) {
      console.error(error);
      alert("Error al eliminar movimientos");
    }
  };




  const [mostrarModalCodigoDuplicado, setMostrarModalCodigoDuplicado] = useState(false);

  // Estados del formulario
  const [formulario, setFormulario] = useState({
    nombre_producto: '',
    precio_compra: 0,
    precio_venta: 0,
    codigo_barras: '',
    referencia: '',
    id_categoria: 0, // <- reemplazamos marca por id_categoria
    id_proveedor: 0,  // ✅ Cambiado de proveedor (string) a id_proveedor (number)
    stock_minimo: 0,
    stock_maximo: 0,
    stock_actual: 0,
    notas: '',
    foto: 0
  });


  // Cargar categorías y proveedores al montar el componente
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categorias`);
        const data = await response.json();
        setCategorias(data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };

    const cargarProveedores = async () => {
      try {
        const response = await fetch(`${API_URL}/api/proveedores`);
        const data = await response.json();
        // Filtrar solo proveedores activos
        const proveedoresActivos = data.filter((p: Proveedor) => p.activo);
        setProveedores(proveedoresActivos);
      } catch (error) {
        console.error('Error al cargar proveedores:', error);
      }
    };

    cargarCategorias();
    cargarProveedores();
  }, []);

  // Cargar productos al montar el componente
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const response = await fetch(`${API_URL}/api/productos`);
      const data = await response.json();
      setProductos(data);
      setProductosOriginales(data); // guardamos todos los productos
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setCargando(false);
    }
  };

  const buscarProducto = () => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      // Si no hay búsqueda, mostramos todos los productos
      setProductos(productosOriginales);
      setProductoSeleccionado(null);
      limpiarFormulario();
      return;
    }

    // 🔍 Buscar por nombre o código de barras
    // Filtramos productos cuyo nombre contenga el texto
    const filtrados = productosOriginales.filter(p =>
      p.nombre_producto.toLowerCase().includes(texto) ||
      p.codigo_barras.toLowerCase().includes(texto)
    );

    setProductos(filtrados);

    if (filtrados.length === 1) {
      setProductoSeleccionado(filtrados[0]);
      llenarFormulario(filtrados[0]);
    } else {
      setProductoSeleccionado(null);
      limpiarFormulario();
    }
  };

  const buscarPorCodigoBarras = async (codigo: string) => {
    try {
      const response = await fetch(`${API_URL}/api/productos/buscar/${codigo}`);
      const data = await response.json();

      if (data.encontrado) {
        setProductoSeleccionado(data.producto);
        llenarFormulario(data.producto);
        setBusqueda(data.producto.nombre_producto);
        setProductos([data.producto]);
      } else {
        // Producto no encontrado - preparar para registro
        setFormulario(prev => ({ ...prev, codigo_barras: codigo }));
        setProductoSeleccionado(null);
        setBusqueda('');
        setProductos([]);
        alert('Producto no encontrado. Puedes registrarlo con los datos básicos.');
      }
    } catch (error) {
      console.error('Error al buscar por código de barras:', error);
    }
  };


  const filtrarPorCategoria = (idCategoria: number | "") => {
    setCategoriaSeleccionada(idCategoria);

    if (idCategoria === "" || idCategoria === 0) {
      // Mostrar todos si no se seleccionó categoría
      setProductos(productosOriginales);
      return;
    }

    // Filtrar productos por categoría
    const filtrados = productosOriginales.filter(
      (p) => p.id_categoria === idCategoria
    );
    setProductos(filtrados);
    setProductoSeleccionado(null);
    limpiarFormulario();
  };



  const llenarFormulario = (producto: Producto) => {
    setFormulario({
      nombre_producto: producto.nombre_producto || '',
    precio_compra: producto.precio_compra || 0,
    precio_venta: producto.precio_venta || 0,
    codigo_barras: producto.codigo_barras || '',
    referencia: producto.referencia || '',
    id_categoria: producto.id_categoria || 0, // ✅ Carga la categoría correcta
      id_proveedor: producto.id_proveedor || 0,  // ✅ Carga el proveedor correcto
      stock_minimo: producto.stock_minimo || 0,
    stock_maximo: producto.stock_maximo || 0,
    stock_actual: producto.stock_actual || 0,
    notas: producto.notas || '',
    foto: producto.foto || 0,
    });
    setModoEdicion(false); // 🔒 Bloquea los campos al seleccionar un producto
  };

  const limpiarFormulario = () => {
    setFormulario({
      nombre_producto: '',
      precio_compra: 0,
      precio_venta: 0,
      codigo_barras: '',
      referencia: '',
      id_categoria: 0, // <- reemplazamos marca por id_categoria
      id_proveedor: 0,  // ✅ Cambiado de proveedor (string) a id_proveedor (number)
      stock_minimo: 0,
      stock_maximo: 0,
      stock_actual: 0,
      notas: '',
      foto: 0
    });
  };

  const guardarProducto = async () => 
  {
    // Validar campos obligatorios
    const camposFaltantes: string[] = [];

    if (!formulario.nombre_producto.trim()) camposFaltantes.push("Nombre Producto");
    if (!formulario.precio_compra || formulario.precio_compra <= 0) camposFaltantes.push("Precio Compra");
    if (!formulario.precio_venta || formulario.precio_venta <= 0) camposFaltantes.push("Precio Venta");
    if (!formulario.id_categoria || formulario.id_categoria === 0) camposFaltantes.push("Categoría");

    if (camposFaltantes.length > 0) {
      // Mostrar mensaje con los campos faltantes
      const mensaje = `⚠️ Faltan campos obligatorios: ${camposFaltantes.join(", ")}`;
      setErrorCampos(mensaje);
      setMostrarModalErrorCampos(true); // 🔥 Mostrar el modal de error
      return;
    } else {
      setErrorCampos(""); // Limpiar mensaje de error si todo está bien
    }
    // Si todos los campos obligatorios están llenos, continuar con el guardado
    try {
      // Obtener información del usuario logueado
      const usuarioLogueado = localStorage.getItem('usuario');
      let datosUsuario = null;
      if (usuarioLogueado) {
        datosUsuario = JSON.parse(usuarioLogueado);
      }

      const url = productoSeleccionado
        ? `${API_URL}/api/productos/${productoSeleccionado.id_producto}`
        : `${API_URL}/api/productos`;

      const method = productoSeleccionado ? 'PUT' : 'POST';

      // Agregar información del usuario al formulario si es un producto nuevo
      const datosEnviar = productoSeleccionado 
        ? formulario 
        : {
            ...formulario,
            creado_por: datosUsuario?.id_usuario || null,
            nombre_creador: datosUsuario?.nombre_usuario || null
          };


      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEnviar),
      });

      const data = await response.json();


      if (response.ok) {
        alert(productoSeleccionado ? 'Producto actualizado correctamente' : 'Producto registrado correctamente');
        cargarProductos();
        limpiarFormulario();
        setProductoSeleccionado(null);
        setModoEdicion(false); // 🔒 Bloquea los campos después de guardar
        
        // ⭐ Disparar evento para actualizar notificaciones en tiempo real
        window.dispatchEvent(new Event('stockActualizado'));
      } else {
        // Verificar si es un error de código duplicado (status 409 o mensaje que contenga "código de barras" o "codigo_barras")
        if (response.status === 409 || data.error?.toLowerCase().includes('codigo') || data.error?.includes('Duplicate entry')) {
          setMostrarModalCodigoDuplicado(true);
        } else {
          alert(`Error: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('Error al guardar el producto');
    }
  };

///////////////////////////////////////////////////////////////
// ⬇️ AQUI PEGA la función eliminarProducto
///////////////////////////////////////////////////////////////

  const eliminarProducto = async () => {
    if (!productoSeleccionado) {
      alert('Selecciona un producto para eliminar');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el producto "${productoSeleccionado.nombre_producto}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/productos/${productoSeleccionado.id_producto}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Producto eliminado correctamente');
        cargarProductos();
        limpiarFormulario();
        setProductoSeleccionado(null);
      } else {
        const erroText = await response.text();
        console.error('Error al eliminar producto:', erroText);
        alert('Error al eliminar el producto');
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      alert('Error al eliminar el producto');
    }
  };

///////////////////////////////////////////////////////////////
// ⬆️ HASTA AQUÍ
///////////////////////////////////////////////////////////////

  // Función para redirigir a EntradaDProductos con el producto seleccionado
  const irAReponerProducto = () => {
    if (!productoSeleccionado) {
      alert('Selecciona un producto para reponer');
      return;
    }

    // Guardar el producto en localStorage para que EntradaDProductos lo reciba
    localStorage.setItem('productoAReponer', JSON.stringify({
      id_producto: productoSeleccionado.id_producto,
      nombre_producto: productoSeleccionado.nombre_producto,
      precio_compra: productoSeleccionado.precio_compra,
      stock_actual: productoSeleccionado.stock_actual,
      stock_minimo: formulario.stock_minimo,
      stock_maximo: formulario.stock_maximo,
      cantidad_sugerida: formulario.stock_maximo - formulario.stock_actual
    }));

    // Navegar a EntradaDProductos
    navigate('/entradaDProductos');
  };

  const handleEscaneo = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoEscaneado.trim()) {
      buscarPorCodigoBarras(codigoEscaneado.trim());
      setCodigoEscaneado('');
      setMostrarModalEscaneo(false);
    }
  };

  return (
    <div className="inventario">
      {/* Header */}
      <div className="inventario-header">
        <h1>📦INVENTARIO DE PRODUCTOS</h1>
        <div className="header-buttons">
        </div>
      </div>

      <div className="inventario-content">
        {/* Panel izquierdo - Búsqueda y lista */}
        <div className="panel-izquierdoIDP">
          <div className="busqueda-container">
            <input
              type="text"
              placeholder="🔍 Buscar productos..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                buscarProducto(); // filtra en tiempo real
              }}
              className="input-busqueda"
            />

            {/* 🔽 Nuevo combo para filtrar por categoría */}
            <select
              value={categoriaSeleccionada}
              onChange={(e) => filtrarPorCategoria(Number(e.target.value) || "")}
              className="select-categoria"
            >
              <option value="">🔽T/Categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre_categoria}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setBusqueda("");
                setCategoriaSeleccionada("");
                setProductos(productosOriginales);
                setProductoSeleccionado(null);
                limpiarFormulario();
              }}
              className="btn-limpiarIP"
            >
              ×
            </button>

            <button onClick={buscarProducto} className="btn-buscar">
              Buscar
            </button>
          </div>


          <div className="lista-productos">
            <div className="lista-header">
              <span>NombreProducto</span>
              <span>Codigo</span>
            </div>
            <div className="lista-contenido">
              {cargando ? (
                <div className="cargando">Cargando...</div>
              ) : productos.length === 0 ? (
                <div className="sin-productos">No hay productos</div>
              ) : (
                productos.map((producto) => (
                  <div
                    key={producto.id_producto}
                    className={`item-producto ${productoSeleccionado?.id_producto === producto.id_producto
                      ? "seleccionado"
                      : ""
                      }`}
                    onClick={() => {
                      setProductoSeleccionado(producto);
                      llenarFormulario(producto);
                    }}
                  >
                    <span>{producto.nombre_producto}</span>
                    <span>{producto.codigo_barras}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel central - Datos del producto */}
        <div className="panel-central">
          <div className="datos-generales">
            <h2>DATOS GENERALES</h2>


            {/* INSTRUCCIONES CODIGO DE BARRAS */}
            <div className="campo">
              <label><span style={{ color: "red" }}>*</span>Código De Barras</label>
              <input
                ref={inputCodigoBarrasRef}
                type="text"
                name="codigo_barras"
                value={formulario.codigo_barras}
                disabled={!modoEdicion} // 🔒 Bloquea si no está en modo edición
                onChange={async (e) => {
                  const nuevoCodigo = e.target.value.trim();
                  setFormulario((prev) => ({ ...prev, codigo_barras: nuevoCodigo }));

                  // Validar duplicidad al completar el código
                  if (nuevoCodigo.length > 0) {
                    try {
                      const response = await fetch(`${API_URL}/api/productos/buscar/${nuevoCodigo}`);
                      const data = await response.json();

                      if (data.encontrado) {
                        // Mostrar modal de código duplicado
                        setMostrarModalCodigoDuplicado(true);
                      }
                    } catch (error) {
                      console.error("Error al verificar duplicidad del código:", error);
                    }
                  }
                }}
                onBlur={async (e) => {
                  // Repetimos la validación por si vino de un escáner o copy-paste rápido
                  const codigo = e.target.value.trim();
                  if (codigo.length > 0) {
                    try {
                      const response = await fetch(`${API_URL}/api/productos/buscar/${codigo}`);
                      const data = await response.json();

                      if (data.encontrado) {
                        setMostrarModalCodigoDuplicado(true);
                      }
                    } catch (error) {
                      console.error("Error al verificar duplicidad del código:", error);
                    }
                  }
                }}
                className="input-codgigo-barras"
              />
            </div>

            {/* FIN INSTRUCCIONES CODIGO DE BARRAS */}
            <div className="formulario-columnas">
              <div className="columna-izquierda">
                <div className="campo">
                  <label><span style={{ color: "red" }}>*</span>Nombre Producto</label>
                  <input
                    type="text"
                    name="nombre_producto"
                    value={formulario.nombre_producto}
                    disabled={!modoEdicion} // 🔒 Bloquea si no está en modo edición
                    onChange={(e) => setFormulario(prev => ({ ...prev, nombre_producto: e.target.value }))}
                  />
                </div>

                <div className="campo">
                  <label><span style={{ color: "red" }}>*</span>Precio Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.precio_compra}
                    disabled={!modoEdicion} // 🔒 Bloquea si no está en modo edición
                    onFocus={(e) => {
                      if (e.target.value === "0") e.target.value = "";
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        e.target.value = "0";
                        setFormulario((prev) => ({
                          ...prev,
                          precio_compra: 0,
                        }));
                      } else {
                        setFormulario((prev) => ({
                          ...prev,
                          precio_compra: parseFloat(e.target.value),
                        }));
                      }
                    }}
                    onChange={(e) =>
                      setFormulario((prev) => ({
                        ...prev,
                        precio_compra: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="campo">
                  <label>Stock Minimo</label>
                  <input
                    type="number"
                    value={formulario.stock_minimo}
                    disabled={!modoEdicion} // 🔒 Bloquea si no está en modo edición
                    onFocus={(e) => {
                      if (e.target.value === "0") e.target.value = "";
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        e.target.value = "0";
                        setFormulario((prev) => ({ ...prev, stock_minimo: 0 }));
                      } else {
                        setFormulario((prev) => ({
                          ...prev,
                          stock_minimo: parseInt(e.target.value) || 0,
                        }));
                      }
                    }}
                    onChange={(e) =>
                      setFormulario((prev) => ({
                        ...prev,
                        stock_minimo: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="campo">
                  <label><span style={{ color: "red" }}>*</span>Categoria</label>
                  <select
                    value={formulario.id_categoria}
                    disabled={!modoEdicion} // 🔒 Bloquea si no está en modo edición
                    onChange={(e) =>
                      setFormulario((prev) => ({
                        ...prev,
                        id_categoria: parseInt(e.target.value) || 0,
                      }))
                    }
                  >
                    <option value="">Seleccionar categoria</option>
                    {categorias.map((categoria) => (
                      <option
                        key={categoria.id_categoria}
                        value={categoria.id_categoria}
                      >
                        {categoria.nombre_categoria}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="columna-derecha">
                <div className="campo">
                  <label><span style={{ color: "red" }}>*</span>Precio Venta</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.precio_venta}
                    disabled={!modoEdicion} // 🔒 Bloquea si no está en modo edición
                    onFocus={(e) => {
                      if (e.target.value === "0") e.target.value = "";
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        e.target.value = "0";
                        setFormulario((prev) => ({ ...prev, precio_venta: 0 }));
                      } else {
                        setFormulario((prev) => ({
                          ...prev,
                          precio_venta: parseFloat(e.target.value),
                        }));
                      }
                    }}
                    onChange={(e) =>
                      setFormulario((prev) => ({
                        ...prev,
                        precio_venta: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="campo">
                  <label>Stock Maximo</label>
                  <input
                    type="number"
                    value={formulario.stock_maximo}
                    disabled={!modoEdicion} // 🔒 Bloquea si no está en modo edición
                    onFocus={(e) => {
                      if (e.target.value === "0") e.target.value = "";
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        e.target.value = "0";
                        setFormulario((prev) => ({ ...prev, stock_maximo: 0 }));
                      } else {
                        setFormulario((prev) => ({
                          ...prev,
                          stock_maximo: parseInt(e.target.value) || 0,
                        }));
                      }
                    }}
                    onChange={(e) =>
                      setFormulario((prev) => ({
                        ...prev,
                        stock_maximo: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="campo stock-actual">
                  <label>Stock Actual</label>
                  <input
                    type="number"
                    value={formulario.stock_actual}
                    className="input-stock-actual"
                    disabled={modoEdicion && !esNuevo ? false : true} // 🔒 Editable solo si modoEdicion y NO es nuevo
                    onChange={(e) => setFormulario((prev) => ({...prev, stock_actual: parseInt(e.target.value) || 0,}))}
                  />
                </div>

                <div className="campo">
                  <label>Proveedor</label>
                  <select
                    value={formulario.id_proveedor}
                    disabled={!modoEdicion} // 🔒 Bloquea si no está en modo edición
                    onChange={(e) =>
                      setFormulario((prev) => ({
                        ...prev,
                        id_proveedor: parseInt(e.target.value) || 0,
                      }))
                    }
                  >
                    <option value="0">Seleccionar proveedor</option>
                    {proveedores.map((proveedor) => (
                      <option
                        key={proveedor.id_proveedor}
                        value={proveedor.id_proveedor}
                      >
                        {proveedor.nombre_proveedor}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Panel derecho - Botones de acción */}
        <div className="panel-derecho">
          <button
            className="btn-agregar"
            onClick={() => {
              limpiarFormulario();
              setProductoSeleccionado(null);
              setBusqueda(""); // limpiar el input de búsqueda
              setProductos(productosOriginales); // mostrar todos los productos
              setModoEdicion(true);          // 🔓 Desbloquear campos para agregar nuevo
              setEsNuevo(true);     // ⚡ Es un producto nuevo
              
              // Enfocar el input de código de barras después de un pequeño delay
              setTimeout(() => {
                inputCodigoBarrasRef.current?.focus();
              }, 100);
            }}
          >
            Agregar nuevo
          </button>
          
          {/* 🟠 Modal de error por campos obligatorios */}
          {mostrarModalErrorCampos && (
            <div className="modal-overlay">
              <div className="modal-duplicado">
                <h3>⚠️ Campos obligatorios incompletos</h3>
                <p>{errorCampos}</p>
                <button
                  onClick={() => {
                    setMostrarModalErrorCampos(false);
                  }}
                >
                  Aceptar
                </button>
              </div>
            </div>
          )}

          {mostrarModalEliminarMovimientos && (
            <div className="modal-overlay">
              <div className="modal-eliminar-movimientos" >
                <h3 className='titulo1-modal'>Eliminar Movimientos</h3>

                {/* Opción 1: conservar meses */}
                <div className="campo">
                  <label>Conservar últimos (meses)</label>
                  <input
                    type="number"
                    value={mesesConservar}
                    onChange={(e) => setMesesConservar(parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* Opción 2: rango de fechas */}
                <div className="campo">
                  <label>Fecha inicio</label>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                </div>
                <div className="campo">
                  <label>Fecha fin</label>
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                </div>
                <button className="btn-aceptar" onClick={handleEliminarMovimientos}>Eliminar</button>
                <button className="btn-cancelar" onClick={() => setMostrarModalEliminarMovimientos(false)}>Cancelar</button>
              </div>
            </div>
          )}


          <button className="btn-actualizar" onClick={guardarProducto}          >
            Actualizar y guardar
          </button>

          <div className="reponer-container">
            <button className="btn-reponer" onClick={irAReponerProducto}>Para reponer</button>
            <input 
              type="text" 
              value={
                formulario.stock_maximo > 0 && formulario.stock_actual < formulario.stock_maximo
                  ? formulario.stock_maximo - formulario.stock_actual
                  : 0
              } 
              readOnly 
              className={`input-reponer ${
                formulario.stock_actual <= 0 
                  ? 'sin-stock' 
                  : formulario.stock_actual < formulario.stock_minimo 
                  ? 'stock-critico' 
                  : formulario.stock_actual < formulario.stock_maximo 
                  ? 'stock-bajo' 
                  : 'stock-normal'
              }`}
            />
          </div>

          <button className="btn-eliminar" onClick={eliminarProducto}>
            Eliminar registro
          </button>

          <button className="btn-editar" onClick={() => {
              if (!productoSeleccionado) {
                alert('Selecciona un producto para editar');
                return;
              }
              setModoEdicion(true); // 🔓 Habilita los campos para editar
              setEsNuevo(false);    // ⚡ No es un producto nuevo
            }}
          >
            Editar registro
          </button>

        </div>

        {/* Panel inferior - Notas 
        <div className="panel-inferior">
          <div className="notas-container">
            <h3>Notas</h3>
            <textarea
              value={formulario.notas}
              onChange={(e) =>
                setFormulario((prev) => ({ ...prev, notas: e.target.value }))
              }
              placeholder="Escribe notas adicionales sobre el producto..."
            />
            <div className="foto-count">
              <span>Foto</span>
              <input type="text" value={formulario.foto} readOnly />
            </div>
          </div>
        </div>*/}

      </div>

      {/* Modal de escaneo */}
      {mostrarModalEscaneo && (
        <div className="modal-escaneo">
          <div className="modal-content">
            <h3>Escanear Código de Barras</h3>
            <form onSubmit={handleEscaneo}>
              <input
                type="text"
                value={codigoEscaneado}
                onChange={(e) => setCodigoEscaneado(e.target.value)}
                placeholder="Escanea o ingresa el código de barras"
                autoFocus
              />
              <div className="modal-buttons">
                <button type="submit">Buscar</button>
                <button
                  type="button"
                  onClick={() => setMostrarModalEscaneo(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 🟢 Modal de código duplicado */}
      {mostrarModalCodigoDuplicado && (
        <div className="modal-overlay">
          <div className="modal-duplicado">
            <h3>⚠️ Código de barras duplicado</h3>
            <p>El código de barras ingresado ya existe en la base de datos.</p>
            <button
              onClick={() => {
                setMostrarModalCodigoDuplicado(false);
                // ✅ NO limpia el campo para que el usuario pueda ver y corregir el código
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventariosP;
