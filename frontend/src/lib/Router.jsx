import Home from '../pages/Home'
import About from '../pages/About'
import Contact from '../pages/Contact'
import Login from '../pages/Login'
import { createBrowserRouter } from 'react-router-dom'


const Router = createBrowserRouter([
  // Navbar Pages
  {
    path: '/',
    element: <Home/>
  },
  {
    path: '/about',
    element: <About/>
  },
  {
    path: '/contact',
    element: <Contact/>
  },
  {
    path: '/login',
    element: <Login/>
  }
  //
]);


export default Router;