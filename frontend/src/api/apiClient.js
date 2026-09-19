// Before fixing the userfilecomplaint upload image/audio/video etc   

// import axios from 'axios'

// const api = axios.create({
//   baseURL: 'http://localhost:8000/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// })

// const PUBLIC_ENDPOINTS = ['/login/', '/register/', '/forgot-password/', '/change-password-otp/']

// api.interceptors.request.use((config) => {
//   const isPublic = PUBLIC_ENDPOINTS.some((path) => config.url?.includes(path))

//   if (!isPublic) {
//     const token = localStorage.getItem('accessToken')
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }
//   }

//   return config
// })

// export default api




import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

const PUBLIC_ENDPOINTS = [
  '/login/',
  '/register/',
  '/forgot-password/',
  '/change-password-otp/',
]

api.interceptors.request.use(
  (config) => {
    const isPublic = PUBLIC_ENDPOINTS.some((path) =>
      config.url?.includes(path)
    )

    if (!isPublic) {
      const token = localStorage.getItem('accessToken')

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    if (config.data instanceof FormData) {
      // Let the browser set multipart/form-data + boundary.
      delete config.headers['Content-Type']
    } else if (config.data !== undefined) {
      config.headers['Content-Type'] = 'application/json'
    }

    return config
  },
  (error) => Promise.reject(error)
)

export default api