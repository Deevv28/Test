import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Note: StrictMode causes double execution in development only
// This is intentional React behavior for detecting side effects
// In production builds, components only run once
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);