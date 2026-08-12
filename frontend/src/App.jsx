import { BrowserRouter, Routes } from 'react-router-dom'
// import Home from './pages/Home.jsx'
// import Login from './pages/Login.jsx'
// import Dashboard from './components/dashboard/Dashboard.jsx'
// import AdminDashboard from './Admin/pages/AdminDashboard.jsx'
// import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} /> */}

        {/* <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        /> */}




      </Routes>
    </BrowserRouter>
  )
}

export default App
