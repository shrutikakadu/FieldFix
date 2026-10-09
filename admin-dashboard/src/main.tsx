import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { connectAuthenticatedSocket } from './services/socket';

if (localStorage.getItem('fieldfix_admin_token')) connectAuthenticatedSocket();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
