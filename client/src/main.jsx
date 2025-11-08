import React from 'react'
import ReactDOM from 'react-dom/client'
// We import the BrowserRouter here
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css' // Assuming you have Tailwind CSS setup

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)