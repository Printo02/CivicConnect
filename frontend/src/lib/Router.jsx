import { createBrowserRouter } from 'react-router-dom'
import Home from '../pages/Home'
import Contact from '../pages/Contact'
import Login from '../pages/Login'
import ErrorPage from '../pages/ErrorPage.jsx'
import ForgotPassword from '../pages/ForgotPassword.jsx'
import Otp from '../pages/Otp.jsx'
import ChangePassword from '../pages/ChangePassword.jsx'



const Router = createBrowserRouter([
  // Navbar Pages
  {
    path: '/',
    element: <Home/>
  },
  {
    path: '/ErrorPage',
    element: <ErrorPage/>
  },
  {
    path: '/contact',
    element: <Contact/>
  },
  {
    path: '/login',
    element: <Login/>
  },
  {
    path: '/error',
    element: <ErrorPage />
  },
  {
    path: '/forgotpassword',
    element: <ForgotPassword/>
  },
  {
    path: '/otp',
    element: <Otp/>
  },
  {
    path: '/changepassword',
    element: <ChangePassword/>
  },
  //
]);


export default Router;