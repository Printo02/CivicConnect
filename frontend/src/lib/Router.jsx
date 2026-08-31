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
import EmployeeList from '../Dept/pages/EmployeeList.jsx'


// import DeptComplaints from '../Dept/pages/DeptComplaints.jsx'
// import DeptBranches from '../Dept/pages/DeptBranches.jsx'
// import DeptEmployees from './../Dept/pages/DeptEmployees';
// import DeptProfile from './../Dept/pages/DeptProfile';
import BranchDashboard from './../Branch/pages/BranchDashboard';
// import DeptEmployeeDashboard from './../DeptEmployee/pages/DeptEmployeeDashboard';
import UserDashboard from './../User/pages/UserDashboard';
import RepresentativeDashboard from './../Representative/pages/RepresentativeDashboard';
import AddBranch from '../Dept/pages/AddBranch.jsx'
import BranchSetting from './../Branch/pages/BranchSetting';
import UserSetting from './../User/pages/UserSetting';
import RepresentativeSetting from './../Representative/pages/RepresentativeSetting';
import MyWardSidebar from '../Representative/components/MyWardSidebar.jsx'
import BranchEmployeeDashboard from './../BranchEmployee/pages/BranchEmployeeDashboard';
import BranchEmployeeSetting from './../BranchEmployee/pages/BranchEmployeeSetting';
import BranchComplaint from './../BranchEmployee/pages/BranchComplaint.jsx';
import AddEmployee from './../Branch/pages/AddEmployee';
import ViewComplaints from './../Branch/pages/ViewComplaints';
import UserMyWard from './../User/pages/UserMyWard';
import UserComplaint from './../User/pages/UserComplaint';




const Router = createBrowserRouter([
  // # ---------------/ COMMON PAGES \---------------- #
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

  // # ---------------/ ADMIN MODULE \---------------- #
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


  // # ---------------/ DEPT MODULE \---------------- #
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
    path: '/dept/EmployeeList', 
    element: (
      <ProtectedRoute allowedRoles={["dept"]}> 
        <EmployeeList/>
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



  // # ---------------/ BRANCH MODULE \---------------- #
  {
    path: '/branch/branchdashboard',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <BranchDashboard/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/branch/branchsettings',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <BranchSetting/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/branch/addemployee',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <AddEmployee/>
    </ProtectedRoute>
    )
  },
  {
    path: '/branch/viewcomplaints',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <ViewComplaints/>
    </ProtectedRoute>
    )
  },


  // # ---------------/ BRANCH-EMPLOYEE MODULE \---------------- #
  {
    path: '/branchemployee/branchemployeedashboard',
    element: <BranchEmployeeDashboard/>
  },
  {
    path: '/branchemployee/branchemployeesetting',
    element: <BranchEmployeeSetting/>
  },
  {
    path: '/branchemployee/Complaints',
    element: <BranchComplaint/>
  },



  // {
  //   path: '/dept/deptdashboard',
  //   element:   (
  //   <ProtectedRoute allowedRoles={["dept"]}> 
  //     <DeptDashboard/> 
  //   </ProtectedRoute>
  //   )
  // },




  // # ---------------/ USER MODULE \---------------- #
  {
    path: '/user/userdashboard',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserDashboard/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/usersetting',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserSetting/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/user-myWard',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserMyWard/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/complaint',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserComplaint/>
    </ProtectedRoute>
    )
  },


  // # ---------------/ REPRESENTATIVE MODULE \---------------- #
  {
    path: '/representative/representativedashboard',
    element:   (
    <ProtectedRoute allowedRoles={["representative"]}> 
      <RepresentativeDashboard/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/representative/representativesettings',
    element:   (
    <ProtectedRoute allowedRoles={["representative"]}> 
      <RepresentativeSetting/>
    </ProtectedRoute>
    )
  },
  {
    path: '/representative/myward',
    element:   (
    <ProtectedRoute allowedRoles={["representative"]}> 
      <MyWardSidebar/>
    </ProtectedRoute>
    )
  },


]);
export default Router;