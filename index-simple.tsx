import React from 'react';
import ReactDOM from 'react-dom/client';

const SimpleApp: React.FC = () => {
  return (
    <div>
      <h1>Simple Test App</h1>
      <p>This is a minimal React application for testing.</p>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>
);