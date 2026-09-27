import React, { useEffect, useState } from 'react'
import { FaBell,FaBullhorn,FaTools,FaInfoCircle,FaPaperPlane,FaClock } from 'react-icons/fa'
import BranchEmployeeLayout from '../components/BranchEmployeeLayout'
import { createMyWardPost,getMyWardPosts } from '../../api/services/BranchEmployee/MyWard.js'


const POST_TYPES = [
  {
    value: 'alert',
    label: 'Alert',
    icon: <FaBell />
  },
  {
    value: 'update',
    label: 'Update',
    icon: <FaBullhorn />
  },
  {
    value: 'action',
    label: 'Work Notice',
    icon: <FaTools />
  },
  {
    value: 'general',
    label: 'General',
    icon: <FaInfoCircle />
  }
]


const STATUS_COLORS = {
  pending: '#F59E0B',
  approved: '#22C55E',
  rejected: '#EF4444'
}


const BranchEmployeeMyWard = () => {

  const [posts, setPosts] = useState([])

  const [filter, setFilter] =
    useState('all')

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [form, setForm] = useState({
    post_type: 'alert',
    title: '',
    description: ''
  })


  const loadPosts = async () => {

    try {

      setLoading(true)

      const data =
        await getMyWardPosts(filter)

      setPosts(data)

    } catch (err) {

      setError(
        err?.response?.data?.detail ||
        'Failed to load posts.'
      )

    } finally {

      setLoading(false)

    }
  }


  useEffect(() => {

    loadPosts()

  }, [filter])


  const handleChange = (event) => {

    const {
      name,
      value
    } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value
    }))
  }


  const handleSubmit = async (event) => {

    event.preventDefault()

    setError('')
    setSuccess('')


    if (!form.title.trim()) {

      setError(
        'Please enter a title.'
      )

      return
    }


    if (!form.description.trim()) {

      setError(
        'Please enter a description.'
      )

      return
    }


    try {

      setSubmitting(true)

      await createMyWardPost({
        post_type: form.post_type,
        title: form.title.trim(),
        description:
          form.description.trim()
      })


      setForm({
        post_type: 'alert',
        title: '',
        description: ''
      })


      setSuccess(
        'Post submitted to the branch for approval.'
      )


      await loadPosts()

    } catch (err) {

      const data =
        err?.response?.data

      setError(
        data?.detail ||
        data?.title?.[0] ||
        data?.description?.[0] ||
        data?.post_type?.[0] ||
        'Unable to submit post.'
      )

    } finally {

      setSubmitting(false)

    }
  }


  return (

    <BranchEmployeeLayout>

      <div
        style={{
          padding: '28px',
          width: '100%'
        }}
      >

        {/* HEADER */}

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '22px'
          }}
        >

          <h1
            style={{
              margin: 0,
              color: 'var(--text-primary)',
              fontSize: '28px'
            }}
          >
            Alerts & Notices
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: 'var(--text-secondary)'
            }}
          >
            Create an alert, update,
            work notice or general announcement.
            Your branch must approve it before
            it is published.
          </p>

        </div>


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}
        >

          <h2
            style={{
              margin: '0 0 20px',
              color: 'var(--text-primary)',
              fontSize: '19px'
            }}
          >
            Create Post
          </h2>


          <div
            style={{
              display: 'grid',
              gap: '18px'
            }}
          >

            <div>

              <label
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Post Type
              </label>

              <select
                name="post_type"
                value={form.post_type}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  background:
                    'var(--surface-sunken)',
                  color:
                    'var(--text-primary)',
                  border:
                    '1px solid var(--border)',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              >

                {POST_TYPES.map((type) => (

                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>

                ))}

              </select>

            </div>


            <div>

              <label
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Title
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={255}
                placeholder="Enter post title"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  background:
                    'var(--surface-sunken)',
                  color:
                    'var(--text-primary)',
                  border:
                    '1px solid var(--border)',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />

            </div>


            <div>

              <label
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                placeholder="Enter announcement details"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  padding: '12px',
                  background:
                    'var(--surface-sunken)',
                  color:
                    'var(--text-primary)',
                  border:
                    '1px solid var(--border)',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />

            </div>


            {error && (
              <div
                style={{
                  color: '#EF4444',
                  fontSize: '14px'
                }}
              >
                {error}
              </div>
            )}


            {success && (
              <div
                style={{
                  color: '#22C55E',
                  fontSize: '14px'
                }}
              >
                {success}
              </div>
            )}


            <div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px 18px',
                  background: '#7C5CFC',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  cursor:
                    submitting
                      ? 'not-allowed'
                      : 'pointer'
                }}
              >

                <FaPaperPlane />

                {
                  submitting
                    ? 'Submitting...'
                    : 'Submit for Approval'
                }

              </button>

            </div>

          </div>

        </form>


        {/* FILTER */}

        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '18px'
          }}
        >

          {[
            'all',
            'pending',
            'approved',
            'rejected'
          ].map((statusValue) => (

            <button
              key={statusValue}
              type="button"
              onClick={() =>
                setFilter(statusValue)
              }
              style={{
                padding: '9px 15px',
                borderRadius: '8px',
                border:
                  filter === statusValue
                    ? '1px solid #7C5CFC'
                    : '1px solid var(--border)',
                background:
                  filter === statusValue
                    ? '#7C5CFC'
                    : 'var(--surface)',
                color:
                  filter === statusValue
                    ? '#FFFFFF'
                    : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}
            >
              {statusValue}
            </button>

          ))}

        </div>


        {/* POSTS */}

        {loading ? (

          <div
            style={{
              color: 'var(--text-secondary)'
            }}
          >
            Loading posts...
          </div>

        ) : posts.length === 0 ? (

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            No posts found.
          </div>

        ) : (

          <div
            style={{
              display: 'grid',
              gap: '14px'
            }}
          >

            {posts.map((post) => (

              <article
                key={post.id}
                style={{
                  background: 'var(--surface)',
                  border:
                    '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    gap: '20px',
                    marginBottom: '10px'
                  }}
                >

                  <div>

                    <div
                      style={{
                        color: '#7C5CFC',
                        fontWeight: '700',
                        fontSize: '13px'
                      }}
                    >
                      {post.post_type_display}
                    </div>

                    <h3
                      style={{
                        margin:
                          '7px 0 0',
                        color:
                          'var(--text-primary)'
                      }}
                    >
                      {post.title}
                    </h3>

                  </div>


                  <span
                    style={{
                      color:
                        STATUS_COLORS[
                          post.approval_status
                        ] ||
                        'var(--text-secondary)',
                      fontWeight: '700',
                      fontSize: '13px',
                      textTransform:
                        'capitalize'
                    }}
                  >
                    {post.approval_status}
                  </span>

                </div>


                <p
                  style={{
                    color:
                      'var(--text-secondary)',
                    lineHeight: '1.6'
                  }}
                >
                  {post.description}
                </p>


                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px'
                  }}
                >
                  <FaClock />

                  {
                    new Date(
                      post.created_at
                    ).toLocaleString('en-IN')
                  }
                </div>


                {
                  post.approval_status
                    === 'rejected' &&
                  post.rejection_reason &&
                  (

                    <div
                      style={{
                        marginTop: '14px',
                        padding: '12px',
                        background:
                          'var(--surface-sunken)',
                        borderRadius: '8px',
                        color: '#EF4444',
                        fontSize: '14px'
                      }}
                    >
                      <strong>
                        Rejection reason:
                      </strong>{' '}
                      {post.rejection_reason}
                    </div>

                  )
                }

              </article>

            ))}

          </div>

        )}

      </div>

    </BranchEmployeeLayout>
  )
}


export default BranchEmployeeMyWard