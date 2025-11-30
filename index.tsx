import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('[Amisa] Starting application initialization...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[Amisa] ERROR: Could not find root element to mount to');
  throw new Error("Could not find root element to mount to");
}

console.log('[Amisa] Root element found, creating React root...');
const root = ReactDOM.createRoot(rootElement);

console.log('[Amisa] Rendering App component...');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[Amisa] Application rendered successfully');