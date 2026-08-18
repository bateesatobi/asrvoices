import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import './styles/elevenlabs-overrides.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { store } from './store';
import AppThemeProvider from './components/AppThemeProvider';

// Suppress ResizeObserver loop limit exceeded error - more aggressive version
const suppressResizeObserverError = (e) => {
  if (e && (e.message?.includes('ResizeObserver loop') || e.reason?.message?.includes('ResizeObserver loop'))) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
  }
};

window.addEventListener('error', suppressResizeObserverError, true);
window.addEventListener('unhandledrejection', suppressResizeObserverError, true);

// Patch window.onerror for older browsers/specific Webpack behavior
const originalOnError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
    return true;
  }
  if (originalOnError) return originalOnError.apply(this, arguments);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <AppThemeProvider>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </AppThemeProvider>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
