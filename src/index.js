import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './index.css';

try {
  const rootElement = document.getElementById('root');
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </React.StrictMode>
  );
} catch (error) {
  const fallback = document.getElementById('startup-fallback');
  if (fallback) {
    fallback.style.display = 'block';
    fallback.innerHTML = `
      <div class="startup-card">
        <h1>ShopApp could not start</h1>
        <p>${error.message}</p>
        <p>Refresh the page or restart the dev server.</p>
      </div>
    `;
  }
}
