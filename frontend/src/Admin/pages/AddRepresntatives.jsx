import React, { useEffect, useState } from 'react'
import Styles from './AddRepresntatives.module.css'
import AdminLayout from '../components/dashboard/AdminLayout'
import { FaSearch, FaUserTie, FaCheck } from 'react-icons/fa'

import { getUsers } from '../../api/services/Admin/adminuserview.js'
import {
  promoteUser,
} from '../../api/services/Admin/representativeService.js'


// ======================================================
// ERROR MESSAGE
// ======================================================

const extractErrorMessage = (err, fallback) => {
  const data = err.response?.data

  if (!data) {
    return fallback
  }

  if (typeof data === 'string') {
    return data
  }

  if (data.error) {
    return data.error
  }

  if (data.detail) {
    return data.detail
  }

  const firstKey = Object.keys(data)[0]

  if (firstKey) {
    const value = data[firstKey]

    return Array.isArray(value)
      ? value[0]
      : String(value)
  }

  return fallback
}


// ======================================================
// COMPONENT
// ======================================================

export default function AssignRepresentative() {

  const [users, setUsers] = useState([])

  const [email, setEmail] = useState('')

  const [matchedUser, setMatchedUser] =
    useState(null)

  const [representatives, setRepresentatives] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [promoting, setPromoting] =
    useState(false)

  const [error, setError] =
    useState('')


  // ======================================================
  // LOAD USERS
  // ======================================================

  const fetchUsers = async () => {

    setLoading(true)
    setError('')

    try {

      const data = await getUsers()

      const userList =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : []

      console.log(
        'Users API response:',
        userList
      )

      setUsers(userList)

      // Only users whose role is representative
      const representativeList =
        userList.filter(
          (user) =>
            String(user.role || '')
              .trim()
              .toLowerCase() ===
            'representative'
        )

      setRepresentatives(
        representativeList
      )

    } catch (err) {

      console.error(
        'Failed to load users:',
        err
      )

      setError(
        extractErrorMessage(
          err,
          'Could not load users.'
        )
      )

    } finally {

      setLoading(false)
    }
  }


  useEffect(() => {
    fetchUsers()
  }, [])


  // ======================================================
  // SEARCH USER BY EMAIL
  // ======================================================

  const handleEmailChange = (value) => {

    setEmail(value)
    setError('')

    const searchEmail =
      value.trim().toLowerCase()

    if (!searchEmail) {

      setMatchedUser(null)

      return
    }

    const user =
      users.find(
        (item) =>
          String(item.email || '')
            .trim()
            .toLowerCase() ===
          searchEmail
      )

    console.log(
      'Matched user:',
      user
    )

    setMatchedUser(
      user || null
    )
  }


  // ======================================================
  // PROMOTE USER
  // ======================================================

  const handlePromote = async () => {

    if (!matchedUser) {

      setError(
        'Enter the email address of a valid user.'
      )

      return
    }


    // Already representative
    if (
      String(matchedUser.role || '')
        .trim()
        .toLowerCase() ===
      'representative'
    ) {

      setError(
        'This user is already a representative.'
      )

      return
    }


    /*
     * The representative API expects the
     * UserDetail/UserProfile ID.
     *
     * Try all common names that may be returned
     * by your users API.
     */

    const userProfileId =
      matchedUser.user_profile_id ||
      matchedUser.user_profile?.id ||
      matchedUser.profile_id


    if (!userProfileId) {

      console.error(
        'User profile ID missing. User returned by API:',
        matchedUser
      )

      setError(
        'User profile ID is not available from the users API. Please update the users API to return user_profile_id.'
      )

      return
    }


    setPromoting(true)
    setError('')


    try {

      console.log(
        'Promoting user profile:',
        userProfileId
      )


      // Promote using UserDetail ID
      await promoteUser(
        Number(userProfileId)
      )


      /*
       * Reload users from backend.
       *
       * This is better than manually changing
       * the local user object because the backend
       * is the source of truth.
       */

      await fetchUsers()


      // Clear search
      setEmail('')

      setMatchedUser(null)

    } catch (err) {

      console.error(
        'Promotion failed:',
        err
      )

      setError(
        extractErrorMessage(
          err,
          'Could not promote user.'
        )
      )

    } finally {

      setPromoting(false)
    }
  }


  // ======================================================
  // RENDER
  // ======================================================

  return (
    <AdminLayout title="Representatives">

      <div className={Styles.card}>

        {/* ================================================
            PROMOTE USER
        ================================================ */}

        <div
          className={
            Styles.cardHeader
          }
        >

          <div>

            <h3>
              Promote User
            </h3>

            <p>
              Search a user by email and make
              them a representative.
            </p>

          </div>

        </div>


        {/* ================================================
            EMAIL SEARCH
        ================================================ */}

        <div
          className={
            Styles.searchBox
          }
          style={{
            maxWidth: '600px',
            marginBottom: '20px',
          }}
        >

          <FaSearch
            className={
              Styles.searchIcon
            }
          />

          <input
            type="email"
            placeholder="Enter user's email"
            value={email}
            onChange={(e) =>
              handleEmailChange(
                e.target.value
              )
            }
            autoComplete="email"
          />

        </div>


        {/* ================================================
            NO USER FOUND
        ================================================ */}

        {email &&
          !matchedUser && (

            <p
              className={
                Styles.assignHint
              }
            >
              No user found with this email.
            </p>

          )}


        {/* ================================================
            USER FOUND
        ================================================ */}

        {matchedUser && (

          <div
            className={
              Styles.matchCard
            }
          >

            <FaUserTie
              className={
                Styles.matchIcon
              }
            />


            <div
              className={
                Styles.matchName
              }
            >

              <strong>
                {matchedUser.first_name ||
                  'Unnamed User'}
              </strong>


              <span
                className={
                  Styles.matchEmail
                }
              >
                {matchedUser.email}
              </span>


              <span
                style={{
                  display: 'block',
                  fontSize: '13px',
                  marginTop: '4px',
                }}
              >
                Current role:{' '}

                {matchedUser.role ||
                  'user'}

              </span>

            </div>


            <button
              type="button"
              className={
                Styles.verifyBtn
              }
              onClick={
                handlePromote
              }
              disabled={
                promoting ||
                String(
                  matchedUser.role || ''
                )
                  .trim()
                  .toLowerCase() ===
                  'representative'
              }
            >

              <FaCheck />

              {promoting
                ? 'Promoting...'
                : String(
                    matchedUser.role || ''
                  )
                    .trim()
                    .toLowerCase() ===
                  'representative'
                  ? 'Already Representative'
                  : 'Make Representative'}

            </button>

          </div>

        )}


        {/* ================================================
            ERROR
        ================================================ */}

        {error && (

          <p
            className={
              Styles.errorText
            }
          >
            {error}
          </p>

        )}


        {/* ================================================
            REPRESENTATIVES
        ================================================ */}

        <div
          style={{
            marginTop: '35px',
          }}
        >

          <div
            className={
              Styles.cardHeader
            }
          >

            <div>

              <h3>
                Representatives
              </h3>

              <p>
                Users who have been promoted
                to representative.
              </p>

            </div>

          </div>


          {loading ? (

            <p>
              Loading...
            </p>

          ) : representatives.length ===
            0 ? (

            <p
              className={
                Styles.assignHint
              }
            >
              No representatives found.
            </p>

          ) : (

            <table
              className={
                Styles.table
              }
            >

              <thead>

                <tr>

                  <th>
                    Name
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Role
                  </th>

                </tr>

              </thead>


              <tbody>

                {representatives.map(
                  (representative) => (

                    <tr
                      key={
                        `representative-${representative.id}`
                      }
                    >

                      <td>
                        {representative.first_name ||
                          'Unnamed User'}
                      </td>


                      <td>
                        {representative.email}
                      </td>


                      <td>
                        Representative
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </AdminLayout>
  )
}