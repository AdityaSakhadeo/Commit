import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Render Error:", error);
  rootElement.innerHTML = '<div style="padding: 20px; color: red;">Application crashed. Check console for details.</div>';
}