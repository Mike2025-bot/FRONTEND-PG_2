# Dashboard SOWIN

Un dashboard profesional y totalmente responsivo para la gestión de tu negocio.

## Características

- **Sidebar colapsable** con navegación completa
- **Navbar** con búsqueda, notificaciones y perfil de usuario
- **Dashboard** con estadísticas, gráficos y tablas
- **Diseño responsivo** que se adapta a todos los dispositivos
- **Interfaz en español** para mejor comprensión
- **Navegación con React Router** para múltiples páginas

## Estructura del Proyecto

```
src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx          # Layout principal
│   │   ├── Layout.css
│   │   ├── Navbar.tsx          # Barra de navegación
│   │   ├── Navbar.css
│   │   ├── Sidebar.tsx         # Barra lateral
│   │   └── Sidebar.css
│   └── dashboard/
│       ├── Dashboard.tsx        # Página principal
│       └── Dashboard.css
├── App.tsx                     # Componente principal
└── main.tsx                    # Punto de entrada
```

## Componentes Principales

### Sidebar
- Navegación principal con iconos y texto
- Modo colapsado para ahorrar espacio
- Información del usuario en la parte inferior
- Diseño responsivo para móviles

### Navbar
- Barra de búsqueda funcional
- Sistema de notificaciones
- Menú de perfil de usuario
- Diseño sticky que se mantiene visible

### Dashboard
- Tarjetas de estadísticas con métricas clave
- Tabla de productos recientes
- Lista de actividades recientes
- Gráfico de ventas interactivo
- Diseño en grid responsivo

## Páginas Disponibles

- **Dashboard** (`/`) - Página principal con estadísticas
- **Productos** (`/productos`) - Gestión de productos
- **Ventas** (`/ventas`) - Gestión de ventas
- **Clientes** (`/clientes`) - Gestión de clientes
- **Reportes** (`/reportes`) - Generación de reportes
- **Configuración** (`/configuracion`) - Configuración del sistema

## Instalación y Uso

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

3. **Construir para producción:**
   ```bash
   npm run build
   ```

## Características Técnicas

- **React 19** con TypeScript
- **React Router DOM** para navegación
- **CSS Grid y Flexbox** para layouts responsivos
- **Gradientes y sombras** para diseño moderno
- **Transiciones suaves** para mejor UX
- **Iconos emoji** para simplicidad

## Personalización

### Colores
Los colores principales están definidos en los archivos CSS:
- Primario: `#667eea` (azul)
- Secundario: `#764ba2` (púrpura)
- Éxito: `#10b981` (verde)
- Peligro: `#ef4444` (rojo)

### Estructura de Datos
Los datos están hardcodeados en los componentes. Para integrar con una API:
1. Reemplaza los arrays de datos con llamadas a la API
2. Usa `useState` y `useEffect` para manejar el estado
3. Implementa loading states y error handling

### Agregar Nuevas Páginas
1. Crea un nuevo componente en `components/`
2. Agrega la ruta en `App.tsx`
3. Agrega el enlace en `Sidebar.tsx`

## Responsive Design

El dashboard se adapta automáticamente a:
- **Desktop** (>1024px): Layout completo con sidebar fijo
- **Tablet** (768px-1024px): Sidebar colapsable
- **Móvil** (<768px): Sidebar oculto, overlay para abrir

## Próximos Pasos

- [ ] Integrar con backend API
- [ ] Agregar autenticación
- [ ] Implementar gráficos reales con Chart.js
- [ ] Agregar más páginas de gestión
- [ ] Implementar modo oscuro
- [ ] Agregar filtros y búsqueda avanzada
