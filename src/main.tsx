import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { localDb } from './lib/local-db';
import { defineCustomElements as defineJeepSqlite } from 'jeep-sqlite/loader';

const init = async () => {
  if (typeof window !== 'undefined') {
    await defineJeepSqlite(window);
    
    // Check if jeep-sqlite is in the DOM, if not, append it
    let jeepSqlite = document.querySelector('jeep-sqlite');
    if (!jeepSqlite) {
      jeepSqlite = document.createElement('jeep-sqlite');
      document.body.appendChild(jeepSqlite);
    }
    await customElements.whenDefined('jeep-sqlite');
  }
  
  try {
    await localDb.initialize();
  } catch (err) {
    console.error("Critical error during database initialization:", err);
  }
  
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
};

init();
