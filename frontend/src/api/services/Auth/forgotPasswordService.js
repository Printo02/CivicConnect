import api from '../../apiClient.js'


export const requestPasswordOTP = async (email) => {
  const response = await api.post('/forgot-password/request-otp/',{ email })
  return response.data
}


export const verifyPasswordOTP = async (email, otp) => {
  const response = await api.post('/forgot-password/verify-otp/',{ email,otp })

  return response.data
}


export const resetForgotPassword = async (email,resetToken,newPassword,confirmPassword) => {
  const response = await api.post('/forgot-password/reset/',
    {
      email,reset_token: resetToken,
      new_password: newPassword,
      confirm_password: confirmPassword
    }
  )

  return response.data
}