import { createBrowserRouter } from 'react-router-dom'
import Home from '../pages/Home'
import Contact from '../pages/Contact'
import Login from '../pages/Login'
import ErrorPage from '../pages/ErrorPage.jsx'
import ForgotPassword from '../pages/ForgotPassword.jsx'
import Otp from '../pages/Otp.jsx'
import ChangePassword from '../pages/ChangePassword.jsx'
import AdminDashboard from '../Admin/pages/AdminDashboard.jsx'
// import Departments from '../Admin/pages/Departments.jsx'
import Representative from '../Admin/pages/Representative.jsx'
import Feedback from '../Admin/pages/Feedback.jsx'
import AdminSetting from '../Admin/pages/AdminSetting.jsx'
import { District } from '../Admin/pages/District.jsx'
import ViewUsers from './../Admin/pages/ViewUsers';
import DeptView from '../Admin/pages/DeptView.jsx'
import DepartmentBranches from '../Admin/pages/DepartmentBranches.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import AddRepresntatives from '../Admin/pages/AddRepresntatives.jsx'
// import AddConstitunency from '../Admin/pages/AddConstitunency.jsx'
import DeptDashboard from '../Dept/pages/DeptDashboard.jsx'
import DeptSetting from '../Dept/pages/DeptSetting.jsx'
import EmployeeList from '../Dept/pages/EmployeeList.jsx'
import BranchDashboard from './../Branch/pages/BranchDashboard';
import UserDashboard from './../User/pages/UserDashboard';
import RepresentativeDashboard from './../Representative/pages/RepresentativeDashboard';
import AddBranch from '../Dept/pages/AddBranch.jsx'
import BranchSetting from './../Branch/pages/BranchSetting';
import UserSetting from './../User/pages/UserSetting';
import RepresentativeSetting from './../Representative/pages/RepresentativeSetting';
import MyWardSidebar from '../Representative/components/MyWardSidebar.jsx'
import BranchEmployeeDashboard from './../BranchEmployee/pages/BranchEmployeeDashboard';
import BranchEmployeeSetting from './../BranchEmployee/pages/BranchEmployeeSetting';
import AddEmployee from './../Branch/pages/AddEmployee';
import UserMyWard from './../User/pages/UserMyWard';
import BranchEmployees from '../Admin/pages/BranchEmployees.jsx'
import ConstituencyList from '../Admin/pages/ConstituencyList.jsx'
import ConstituencyManagement from '../Admin/pages/AddConstitunency.jsx'
import { Infos } from '../Admin/pages/infos.jsx'
import { Complaints } from '../User/pages/Complaints.jsx'
import UserComplaintHistory from '../User/pages/UserComplaintHistory.jsx'
import UserFileComplaint from '../User/pages/UserFileComplaint.jsx'
import NearbyAuths from './../User/pages/NearbyAuths';
import ElectionBulkAssignment from '../Admin/pages/ElectionBulkAssignment.jsx'
import RepresentativeComplaints from '../Representative/pages/RepresentativeComplaints.jsx'
import RepresentativeComplaintDetail from '../Representative/pages/RepresentativeComplaintDetail.jsx'
import UserComplaintDetail from './../User/pages/UserComplaintDetail';
import BranchEmployeeComplaintDetail from '../BranchEmployee/pages/BranchEmployeeComplaintDetail.jsx'
import BranchEmployeeComplaints from '../BranchEmployee/pages/BranchEmployeeComplaints.jsx'
import BranchComplaints from '../Branch/pages/BranchComplaints.jsx'
import BranchComplaintDetail from '../Branch/pages/BranchComplaintDetail.jsx'
import UserMyWardHome from './../User/pages/MyWard/UserMyWardHome';
import UserMyWardAlerts from '../User/pages/MyWard/UserMyWardAlerts.jsx'
import UserMyWardUpdates from './../User/pages/MyWard/UserMyWardUpdates';
import UserMyWardComplaints from './../User/pages/MyWard/UserMyWardComplaints';
import RepresentativeCreateMyWardPost from '../Representative/pages/MyWard/RepresentativeCreateMyWardPost.jsx'
import RepresentativeMyWardHome from '../Representative/pages/MyWard/RepresentativeMyWardHome.jsx'
import BranchCreateMyWardPost from '../Branch/pages/MyWard/BranchCreateMyWardPost.jsx'
import BranchMyWardHome from '../Branch/pages/MyWard/BranchMyWardHome.jsx'
import UserReportDisaster from '../User/pages/MyWard/UserReportDisaster.jsx'
import RepresentativeDisasterReports from '../Representative/pages/MyWard/RepresentativeDisasterReports.jsx'
import RepresentativePublishAlert from '../Representative/pages/MyWard/RepresentativePublishAlert.jsx'
import BranchMyWardPosts from '../Branch/pages/MyWard/BranchMyWardPosts.jsx'
import BranchDisasterReports from '../Branch/pages/MyWard/BranchDisasterReports.jsx'
import BranchPublishAlert from '../Branch/pages/MyWard/BranchPublishAlert.jsx'
import UserPublishAlert from '../User/pages/MyWard/UserPublishAlert.jsx'
import RepAlerts from '../Representative/pages/MyWard/RepAlerts.jsx'
import BranchEmployeeMyWard from '../BranchEmployee/pages/BranchEmployeeMyWard.jsx'
import BranchMyWardApprovals from '../Branch/pages/MyWard/BranchMyWardApprovals.jsx'




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
    path: '/admin/infos',
    element: (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Infos/>
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
    path: "/admin/deptview/:departmentId/branches",
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
  // {
  //   path: '/admin/addconstituencies',
  //   element:   (
  //   <ProtectedRoute allowedRoles={["admin"]}> 
  //     <AddConstitunency/>
  //   </ProtectedRoute>
  //   )
  // },
  {
    path: '/admin/constituencies',
    element:   (
    <ProtectedRoute allowedRoles={["admin"]}> 
      <ConstituencyManagement/>
    </ProtectedRoute>
    )
  },
  {
    path: '/admin/constituencies/:government',
    element:   (
    <ProtectedRoute allowedRoles={["admin"]}> 
      <ConstituencyList/>
    </ProtectedRoute>
    )
  },
  {
    path: '/admin/rep-bulk-assignment',
    element:   (
    <ProtectedRoute allowedRoles={["admin"]}> 
      <ElectionBulkAssignment/>
    </ProtectedRoute>
    )
  },
  {
    path: '/admin/branches/:branchId/employees',
    element:   (
    <ProtectedRoute allowedRoles={["admin"]}> 
      <BranchEmployees/>
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
    path: '/branch/complaints',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <BranchComplaints/>
    </ProtectedRoute>
    )
  },
  {
    path: '/branch/complaints/:id',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <BranchComplaintDetail/>
    </ProtectedRoute>
    )
  },
  {
    path: '/branch/update/',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <BranchCreateMyWardPost/>
    </ProtectedRoute>
    )
  },
  {
    path: '/branch/mypost-updates/',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <BranchMyWardPosts/>
    </ProtectedRoute>
    )
  },
  {
    path: '/branch/disaster-reports/',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <BranchDisasterReports/>
    </ProtectedRoute>
    )
  },
  {
    path: '/branch/alerts/',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <BranchPublishAlert/>
    </ProtectedRoute>
    )
  },
  {
    path: '/branch/employee-post-approve/',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <BranchMyWardApprovals/>
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
    path: '/branchemployee/complaints/',
    element: <BranchEmployeeComplaints/>
  },
  {
    path: '/branchemployee/complaints/:id',
    element: <BranchEmployeeComplaintDetail/>
  },
  {
    path: '/branchemployee/employee-Ward-post',
    element: <BranchEmployeeMyWard/>
  },
  








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
    path: '/user/complaintviews',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <Complaints/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/complaint-history',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserComplaintHistory/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/complaint-history/:id',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserComplaintDetail/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/file-complaint',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserFileComplaint/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/nearby-auths',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <NearbyAuths/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/view-alerts',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserPublishAlert />
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
    path: '/representative/complaints/',
    element:   (
    <ProtectedRoute allowedRoles={["representative"]}> 
      <RepresentativeComplaints/>
    </ProtectedRoute>
    )
  },
  {
    path: '/representative/complaints/:id',
    element:   (
    <ProtectedRoute allowedRoles={["representative"]}> 
      <RepresentativeComplaintDetail/>
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


// # ---------------/ REPRESENTATIVE MODULE \---------------- #

  // USER
  {
    path: '/user/myward',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserMyWardHome/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/myward/alerts',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserMyWardAlerts/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/myward/updates',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserMyWardUpdates/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/myward/complaints',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserMyWardComplaints/>
    </ProtectedRoute>
    )
  },
  {
    path: '/user/myward/report-disaster',
    element:   (
    <ProtectedRoute allowedRoles={["user"]}> 
      <UserReportDisaster/>
    </ProtectedRoute>
    )
  },


  // BRANCH
  {
    path: '/branch/myward',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <BranchMyWardHome/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/branch/myward/create',
    element:   (
    <ProtectedRoute allowedRoles={["branch"]}> 
      <BranchCreateMyWardPost/> 
    </ProtectedRoute>
    )
  },


  // REPRESENTATIVE
  {
    path: '/representative/myward',
    element:   (
    <ProtectedRoute allowedRoles={["representative"]}> 
      <RepresentativeMyWardHome/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/representative/myward/create',
    element:   (
    <ProtectedRoute allowedRoles={["representative"]}> 
      <RepresentativeCreateMyWardPost/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/representative/myward/disasters',
    element:   (
    <ProtectedRoute allowedRoles={["representative"]}> 
      <RepresentativeDisasterReports/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/representative/myward/alerts',
    element:   (
    <ProtectedRoute allowedRoles={["representative"]}> 
      <RepresentativePublishAlert/> 
    </ProtectedRoute>
    )
  },
  {
    path: '/representative/view-alerts',
    element:   (
    <ProtectedRoute allowedRoles={["representative"]}> 
      <RepAlerts/> 
    </ProtectedRoute>
    )
  },



]);
export default Router;