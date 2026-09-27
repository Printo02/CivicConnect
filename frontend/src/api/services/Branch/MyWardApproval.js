import api from '../../apiClient.js'


// GET POSTS WAITING FOR BRANCH APPROVAL

export const getMyWardApprovalPosts = async (status = 'pending') => {
  const params = {}

  if (status && status !== 'all') {
    params.status = status
  }
  const response = await api.get('/branch/myward/post-approvals/',{params})
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}


// APPROVE / REJECT
export const reviewMyWardPost = async (postId,decision,rejectionReason = '') => {
  const response = await api.patch(`/branch/myward/post-approvals/${postId}/review/`,
    {
      decision,
      rejection_reason: rejectionReason
    }
  )
  return response.data
}