import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import Router from './lib/Router.jsx'
import { StrictMode } from 'react'
import { ThemeProvider } from './Admin/context/ThemeContext'


createRoot(document.getElementById('root')).render(

  <ThemeProvider>
    <RouterProvider router={Router}/>
  </ThemeProvider>

  

)



