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
import AddRepresntatives from '../Admin/pages/AddRepresntatives.jsx'
import AddConstitunency from '../Admin/pages/AddConstitunency.jsx'
import DeptDashboard from '../Dept/pages/DeptDashboard.jsx'
import DeptSetting from '../Dept/pages/DeptSetting.jsx'
import Branches from '../Dept/pages/Branches.jsx'


// import DeptComplaints from '../Dept/pages/DeptComplaints.jsx'
// import DeptBranches from '../Dept/pages/DeptBranches.jsx'
// import DeptEmployees from './../Dept/pages/DeptEmployees';
// import DeptProfile from './../Dept/pages/DeptProfile';
import BranchDashboard from './../Branch/pages/BranchDashboard';
import DeptEmployeeDashboard from './../DeptEmployee/pages/DeptEmployeeDashboard';
import UserDashboard from './../User/pages/UserDashboard';
import RepresentativeDashboard from './../Representative/pages/RepresentativeDashboard';
import AddBranch from '../Dept/pages/AddBranch.jsx'



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
  {
    path: '/admin/addrepresentatives',
    element:   (
    <ProtectedRoute allowedRoles={["admin"]}> 
      <AddRepresntatives/>
    </ProtectedRoute>
    )
  },
  {
    path: '/admin/addconstituencies',
    element:   (
    <ProtectedRoute allowedRoles={["admin"]}> 
      <AddConstitunency/>
    </ProtectedRoute>
    )
  },


  //  ------------- Department ------------- \\

  {
    path: '/dept/deptdashboard',
    element:   (
    <ProtectedRoute allowedRoles={["dept"]}> 
      <DeptDashboard/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/dept/deptsettings',
    element: (
      <ProtectedRoute allowedRoles={["dept"]}> 
        <DeptSetting/>
      </ProtectedRoute>  
    )
  },
  {
    path: '/dept/branches',
    element: (
      <ProtectedRoute allowedRoles={["dept"]}> 
        <Branches/>
      </ProtectedRoute>  
    )
  },
  {
    path: '/dept/branches/addbranch',
    element: (
      <ProtectedRoute allowedRoles={["dept"]}> 
        <AddBranch/>
      </ProtectedRoute>  
    )
  },




  //  ------------- Branch ------------- \\

  {
    path: '/branch/branchdashboard',
    element: <BranchDashboard/> 
  },
  // {
  //   path: '/dept/deptdashboard',
  //   element:   (
  //   <ProtectedRoute allowedRoles={["dept"]}> 
  //     <DeptDashboard/> 
  //   </ProtectedRoute>
  //   )
  // },



  //  ------------- Dept-employee ------------- \\

  {
    path: '/deptemployee/deptemployeedashboard',
    element: <DeptEmployeeDashboard/>
  },
  // {
  //   path: '/dept/deptdashboard',
  //   element:   (
  //   <ProtectedRoute allowedRoles={["dept"]}> 
  //     <DeptDashboard/> 
  //   </ProtectedRoute>
  //   )
  // },





  //  ------------- User ------------- \\
  {
    path: '/user/userdashboard',
    element: <UserDashboard/>
  },
  // {
  //   path: '/dept/deptdashboard',
  //   element:   (
  //   <ProtectedRoute allowedRoles={["dept"]}> 
  //     <DeptDashboard/> 
  //   </ProtectedRoute>
  //   )
  // },



  //  ------------- representative ------------- \\
  {
    path: '/representative/representativedashboard',
    element: <RepresentativeDashboard/>
  },
  // {
  //   path: '/dept/deptdashboard',
  //   element:   (
  //   <ProtectedRoute allowedRoles={["dept"]}> 
  //     <DeptDashboard/> 
  //   </ProtectedRoute>
  //   )
  // },


]);


export default Router;