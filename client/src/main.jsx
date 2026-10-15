import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DocumentProvider } from './context/DocumentContext';
import { ThemeProvider } from './context/ThemeContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import App from './App';
import './index.css';
import '@xyflow/react/dist/style.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DocumentProvider>
          <ThemeProvider>
            <AccessibilityProvider>
              <App />
            </AccessibilityProvider>
          </ThemeProvider>
        </DocumentProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
