import { createBrowserRouter } from 'react-router-dom'
import Home from '../pages/Home'
import Contact from '../pages/Contact'
import Login from '../pages/Login'
import ErrorPage from '../pages/ErrorPage.jsx'
import ForgotPassword from '../pages/ForgotPassword.jsx'
import Otp from '../pages/Otp.jsx'
import ChangePassword from '../pages/ChangePassword.jsx'
import AdminDashboard from '../Admin/pages/AdminDashboard.jsx'
import Departments from '../Admin/pages/Departments.jsx'
import Representative from '../Admin/pages/Representative.jsx'
import Feedback from '../Admin/pages/Feedback.jsx'
import AdminSetting from '../Admin/pages/AdminSetting.jsx'
import { District } from '../Admin/pages/District.jsx'
import ViewUsers from './../Admin/pages/ViewUsers';
import DeptView from '../Admin/pages/DeptView.jsx'
import DepartmentBranches from '../Admin/pages/DepartmentBranches.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import Deptdashboard from './../Dept/pages/Deptdashboard';
import DeptComplaints from '../Dept/pages/DeptComplaints.jsx'
import DeptBranches from '../Dept/pages/DeptBranches.jsx'
import DeptEmployees from './../Dept/pages/DeptEmployees';
import DeptProfile from './../Dept/pages/DeptProfile';



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

  // Admin 

  {
    path: '/admin/admindashboard',
    element: (<ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
              </ProtectedRoute>)
  },
  {
    path: '/admin/department',
    element: (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Departments/>
    </ProtectedRoute>
    )
  },
  {
    path: '/admin/representative',
    element: 
    (<ProtectedRoute allowedRoles={["admin"]}>
        <Representative/>
      </ProtectedRoute>
      )
  },
  {
    path: '/admin/feedback',
    element:  (<ProtectedRoute allowedRoles={["admin"]}>
      <Feedback/>
    </ProtectedRoute>
    )
  },
  {
    path: '/admin/adminsetting',
    element:  (<ProtectedRoute allowedRoles={["admin"]}> 
      <AdminSetting/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/admin/district',
    element:  (<ProtectedRoute allowedRoles={["admin"]}>
          <District/>
      </ProtectedRoute>)
    
  },
  {
    path: '/admin/viewusers',
    element:  (<ProtectedRoute allowedRoles={["admin"]}> 
          <ViewUsers/>
      </ProtectedRoute> )
    
  },
  {
    path: '/admin/deptview',
    element:  (
    <ProtectedRoute allowedRoles={["admin"]}> 
        <DeptView/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/admin/departments/:id',
    element:   (
    <ProtectedRoute allowedRoles={["admin"]}> 
      <DepartmentBranches/> 
    </ProtectedRoute>
    )
  },

  //  ------------- Department ------------- \\

  {
    path: '/dept/deptdashboard',
    element:   (
    <ProtectedRoute allowedRoles={["dept"]}> 
      <Deptdashboard/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/dept/complaints',
    element:   (
    <ProtectedRoute allowedRoles={["dept"]}> 
      <DeptComplaints/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/dept/DeptBranches',
    element:   (
    <ProtectedRoute allowedRoles={["dept"]}> 
      <DeptBranches/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/dept/DeptEmployees',
    element:   (
    <ProtectedRoute allowedRoles={["dept"]}> 
      <DeptEmployees/>
    </ProtectedRoute>
    )
  },
  {
    path: '/dept/DeptProfile',
    element:   (
    <ProtectedRoute allowedRoles={["dept"]}> 
      <DeptProfile/>
    </ProtectedRoute>
    )
  },


]);


export default Router;