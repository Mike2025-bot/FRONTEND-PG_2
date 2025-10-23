// Punto de entrada principal de la aplicación React
// Monta el componente <App /> en el DOM

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Renderiza la aplicación dentro del elemento #root
document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
