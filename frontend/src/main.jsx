import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RouterProvider } from 'react-router-dom'
import Router from './lib/Router.jsx'
import { StrictMode } from 'react'



createRoot(document.getElementById('root')).render(

  <StrictMode>
    <RouterProvider router={Router}/>
  </StrictMode>

  

)
