import api from '../../apiClient.js'


// // ======================================================
// // GET ALL REPRESENTATIVES
// // ======================================================

// export const getRepresentatives = async () => {
//   const res = await api.get(
//     '/admin/representatives/'
//   )

//   return Array.isArray(res.data)
//     ? res.data
//     : res.data.results || []
// }


// // ======================================================
// // ADD REPRESENTATIVE
// // ======================================================

// export const addRepresentative = async ({
//   user_profile,
//   constituency,
// }) => {
//   const res = await api.post(
//     '/admin/representatives/',
//     {
//       user_profile,
//       constituency,
//     }
//   )

//   return res.data
// }


// // ======================================================
// // PROMOTE USER TO REPRESENTATIVE
// // ======================================================
// //
// // This uses the Representative API.
// //
// // userProfileId MUST be the UserDetail/UserProfile ID,
// // NOT the Django User.id.
// //
// // ======================================================

// export const promoteRepresentative = async (
//   userProfileId
// ) => {

//   if (!userProfileId) {
//     throw new Error(
//       'User profile ID is missing.'
//     )
//   }

//   const res = await api.post(
//     '/admin/representatives/',
//     {
//       user_profile: Number(userProfileId),
//     }
//   )

//   return res.data
// }




// export const promoteUser = async (userProfileId) => {
//   const res = await api.post(
//     '/admin/representatives/',
//     {
//       user_profile: Number(userProfileId),
//     }
//   )

//   return res.data
// }

// export const assignConstituency = async (
//   representativeId,
//   constituencyId
// ) => {

//   const res = await api.patch(`/admin/representatives/${representativeId}/assign-constituency/`,
//     {
//       constituency: constituencyId,
//     }
//   )

//   return res.data
// }



// export const removeRepresentative = async (
//   representativeId
// ) => {

//   const res = await api.delete(
//     `/admin/representatives/${representativeId}/`
//   )

//   return res.data
// }





export const getRepresentatives = async () => {
  const response = await api.get(
    '/admin/representatives/'
  )

  return Array.isArray(response.data)
    ? response.data
    : response.data.results || []
}


export const promoteUser = async (userProfileId) => {
  const response = await api.post(
    '/admin/representatives/',
    {
      user_profile: Number(userProfileId),
    }
  )

  return response.data
}


export const removeRepresentative = async (
  representativeId
) => {
  const response = await api.delete(
    `/admin/representatives/${representativeId}/`
  )

  return response.data
}


export const assignConstituency = async (
  representativeId,
  constituencyId
) => {
  const response = await api.patch(
    `/admin/representatives/${representativeId}/assign-constituency/`,
    {
      constituency: constituencyId,
    }
  )

  return response.data
}