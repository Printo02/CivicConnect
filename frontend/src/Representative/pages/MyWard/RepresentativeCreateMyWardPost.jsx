import { useCallback,useEffect,useMemo,useState } from 'react'
import { FaBullhorn,FaHeading,FaAlignLeft,FaPaperPlane,FaCheckCircle,
  FaExclamationCircle,FaBell,FaTools,FaInfoCircle,FaClock,FaSyncAlt,FaListAlt,FaEye} from 'react-icons/fa'
import RepresentativeSidebar from '../../components/RepresentativeSidebar'
import Styles from '../../components/module.css/MyWard.module.css'
import { createRepresentativeMyWardPost,getRepresentativeMyWardPosts} from '../../../api/services/Representative/MyWard'
import { useNavigate  } from 'react-router-dom'


const POST_TYPES = [
  { value: 'alert',label: 'Alert',icon: <FaBell />},
  { value: 'update',label: 'Update',icon: <FaBullhorn />},
  { value: 'action',label: 'Action / Work Notice',icon: <FaTools />},
  { value: 'general',label: 'General',icon: <FaInfoCircle />},
]


const formatDateTime = (value) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}


export default function RepresentativeCreateMyWardPost() {

  const [postType, setPostType] = useState('update')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)

  const [feedback, setFeedback] = useState({
    type: '',
    message: '',
  })

  const navigate = useNavigate();
  // ============================================================
  // MY POSTS
  // ============================================================

  const [posts, setPosts] = useState([])

  const [postsLoading, setPostsLoading] =
    useState(true)

  const [postsRefreshing, setPostsRefreshing] =
    useState(false)

  const [postsError, setPostsError] =
    useState('')

  const [postFilter, setPostFilter] =
    useState('all')


  // ============================================================
  // LOAD REPRESENTATIVE POSTS
  // ============================================================

  const loadPosts = useCallback(
    async (refresh = false) => {

      try {

        if (refresh) {
          setPostsRefreshing(true)
        } else {
          setPostsLoading(true)
        }

        setPostsError('')

        const data =
          await getRepresentativeMyWardPosts()

        setPosts(
          Array.isArray(data)
            ? data
            : []
        )

      } catch (err) {

        console.error(
          'Failed to load representative posts:',
          err
        )

        setPostsError(
          err?.response?.data?.detail ||
          'Unable to load your posts.'
        )

        setPosts([])

      } finally {

        setPostsLoading(false)
        setPostsRefreshing(false)

      }

    },
    []
  )


  useEffect(() => {
    loadPosts()
  }, [loadPosts])


  // ============================================================
  // POST COUNTS
  // ============================================================

  const postCounts = useMemo(() => {

    return {
      total: posts.length,

      alert: posts.filter(
        (post) =>
          post.post_type === 'alert'
      ).length,

      update: posts.filter(
        (post) =>
          post.post_type === 'update'
      ).length,

      action: posts.filter(
        (post) =>
          post.post_type === 'action'
      ).length,

      general: posts.filter(
        (post) =>
          post.post_type === 'general'
      ).length,
    }

  }, [posts])


  // ============================================================
  // FILTERED POSTS
  // ============================================================

  const filteredPosts = useMemo(() => {

    if (postFilter === 'all') {
      return posts
    }

    return posts.filter(
      (post) =>
        post.post_type === postFilter
    )

  }, [posts, postFilter])


  // ============================================================
  // HELPERS
  // ============================================================

  const getPostType = (value) => {

    return (
      POST_TYPES.find(
        (type) =>
          type.value === value
      ) ||
      POST_TYPES[3]
    )
  }


  const resetFeedback = () => {

    if (feedback.message) {

      setFeedback({
        type: '',
        message: '',
      })

    }

  }


  // ============================================================
  // SUBMIT
  // ============================================================

  const submit = async (event) => {

    event.preventDefault()

    const cleanTitle =
      title.trim()

    const cleanDescription =
      description.trim()


    if (!cleanTitle) {

      setFeedback({
        type: 'error',
        message:
          'Please enter a post title.',
      })

      return
    }


    if (!cleanDescription) {

      setFeedback({
        type: 'error',
        message:
          'Please enter a description.',
      })

      return
    }


    try {

      setLoading(true)

      setFeedback({
        type: '',
        message: '',
      })


      const createdPost =
        await createRepresentativeMyWardPost({
          post_type: postType,
          title: cleanTitle,
          description: cleanDescription,
        })


      /*
       * Immediately show the newly created
       * post in My Posts.
       */
      if (createdPost?.id) {

        setPosts(
          (current) => [
            createdPost,
            ...current.filter(
              (item) =>
                item.id !== createdPost.id
            ),
          ]
        )

      } else {

        /*
         * Fallback if your POST endpoint
         * returns no object.
         */
        await loadPosts(true)

      }


      setFeedback({
        type: 'success',
        message:
          'Post published successfully.',
      })


      setPostType('update')
      setTitle('')
      setDescription('')


    } catch (err) {

      console.error(
        'Failed to publish MyWard post:',
        err
      )

      const data =
        err?.response?.data


      const errorMessage =
        data?.detail ||
        data?.title?.[0] ||
        data?.description?.[0] ||
        data?.post_type?.[0] ||
        'Unable to publish post.'


      setFeedback({
        type: 'error',
        message: errorMessage,
      })


    } finally {

      setLoading(false)

    }
  }


  return (

    <div className={Styles.page}>

      <RepresentativeSidebar />


      <main className={Styles.content}>


        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <header className={Styles.createHeader}>

          <div>

            <div className={Styles.eyebrow}>
              <FaBullhorn />
              MyWard
            </div>

            <h1>
              Publish Update
            </h1>

            <p>
              Share alerts, constituency updates,
              public notices and important information
              with citizens in your constituency.
            </p>

          </div>

        </header>


        {/* =====================================================
            TWO COLUMN WORKSPACE
        ===================================================== */}

        <div className={Styles.createWorkspace}>


          {/* ===================================================
              LEFT - CREATE POST
          =================================================== */}

          <form
            className={Styles.createPostCard}
            onSubmit={submit}
          >

            <div className={Styles.formHeader}>

              <div
                className={
                  Styles.formHeaderIcon
                }
              >
                <FaPaperPlane />
              </div>

              <div>

                <h2>
                  Create MyWard Post
                </h2>

                <p>
                  The update will be visible
                  to citizens in your constituency.
                </p>

              </div>

            </div>


            {/* POST TYPE */}

            <div className={Styles.group}>

              <label
                className={Styles.label}
                htmlFor="postType"
              >

                <FaBullhorn />

                Post type

                <span
                  className={Styles.required}
                >
                  *
                </span>

              </label>


              <select
                id="postType"
                className={Styles.select}
                value={postType}
                disabled={loading}
                onChange={(event) => {

                  setPostType(
                    event.target.value
                  )

                  resetFeedback()

                }}
              >

                {POST_TYPES.map(
                  (type) => (

                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>

                  )
                )}

              </select>


              <small
                className={Styles.fieldHint}
              >
                Choose the category that best
                describes your announcement.
              </small>

            </div>


            {/* TITLE */}

            <div className={Styles.group}>

              <div className={Styles.labelRow}>

                <label
                  className={Styles.label}
                  htmlFor="postTitle"
                >

                  <FaHeading />

                  Title

                  <span
                    className={Styles.required}
                  >
                    *
                  </span>

                </label>


                <span
                  className={
                    Styles.characterCount
                  }
                >
                  {title.length}/255
                </span>

              </div>


              <input
                id="postTitle"
                type="text"
                className={Styles.input}
                value={title}
                maxLength={255}
                disabled={loading}
                placeholder="Enter a clear title for the update"
                onChange={(event) => {

                  setTitle(
                    event.target.value
                  )

                  resetFeedback()

                }}
                required
              />

            </div>


            {/* DESCRIPTION */}

            <div className={Styles.group}>

              <div className={Styles.labelRow}>

                <label
                  className={Styles.label}
                  htmlFor="postDescription"
                >

                  <FaAlignLeft />

                  Description

                  <span
                    className={Styles.required}
                  >
                    *
                  </span>

                </label>


                <span
                  className={
                    Styles.characterCount
                  }
                >
                  {description.length}/2000
                </span>

              </div>


              <textarea
                id="postDescription"
                className={Styles.textarea}
                value={description}
                rows={8}
                maxLength={2000}
                disabled={loading}
                placeholder="Write the details citizens should know..."
                onChange={(event) => {

                  setDescription(
                    event.target.value
                  )

                  resetFeedback()

                }}
                required
              />

            </div>


            {/* FEEDBACK */}

            {feedback.message && (

              <div
                className={
                  feedback.type === 'success'
                    ? Styles.successMessage
                    : Styles.errorMessage
                }
              >

                {feedback.type === 'success'
                  ? <FaCheckCircle />
                  : <FaExclamationCircle />
                }

                <span>
                  {feedback.message}
                </span>

              </div>

            )}


            {/* ACTIONS */}

            <div className={Styles.formActions}>

              <button
                type="button"
                className={Styles.secondary}
                disabled={loading}
                onClick={() => {

                  setPostType('update')
                  setTitle('')
                  setDescription('')

                  setFeedback({
                    type: '',
                    message: '',
                  })

                }}
              >
                Clear
              </button>


              <button
                type="submit"
                className={Styles.primary}
                disabled={
                  loading ||
                  !title.trim() ||
                  !description.trim()
                }
              >

                <FaPaperPlane />

                {loading
                  ? 'Publishing...'
                  : 'Publish Post'
                }

              </button>

            </div>

          </form>


          {/* ===================================================
              RIGHT - MY POSTS
          =================================================== */}

          <aside className={Styles.myPostsPanel}>


            {/* PANEL HEADER */}

            <div className={Styles.myPostsHeader}>

              <div>

                <span className={Styles.myPostsLabel}>
                  My Posts
                </span>

                <div
                  className={
                    Styles.myPostsCountRow
                  }
                >

                  <strong>
                    {postCounts.total}
                  </strong>

                  <span>
                    published posts
                  </span>

                </div>

              </div>


              <button
                type="button"
                className={
                  Styles.myPostsRefresh
                }
                onClick={() =>
                  loadPosts(true)
                }
                disabled={
                  postsLoading ||
                  postsRefreshing
                }
                title="Refresh posts"
              >

                <FaSyncAlt
                  className={
                    postsRefreshing
                      ? Styles.spin
                      : ''
                  }
                />

              </button>

            </div>


            {/* ===============================================
                POST TYPE COUNTS
            =============================================== */}

            <div className={Styles.myPostCategories}>


              <button type="button" className={Styles.myPostCategory}
                onClick={() => navigate('/representative/myward/alerts')}>
                <div className={Styles.categoryIcon}>
                  <FaEye />
                </div>
                <div>
                  <span>View all my post</span>
                </div>
              </button>

              <button
                type="button"
                className={`${Styles.myPostCategory} ${
                  postFilter === 'alert'
                    ? Styles.myPostCategoryActive
                    : ''
                }`}
                onClick={() =>
                  setPostFilter(
                    postFilter === 'alert'
                      ? 'all'
                      : 'alert'
                  )
                }
              >

                <div
                  className={
                    Styles.categoryIcon
                  }
                >
                  <FaBell />
                </div>

                <div>
                  <span>
                    Alerts
                  </span>

                  <strong>
                    {postCounts.alert}
                  </strong>
                </div>

              </button>


              <button
                type="button"
                className={`${Styles.myPostCategory} ${
                  postFilter === 'update'
                    ? Styles.myPostCategoryActive
                    : ''
                }`}
                onClick={() =>
                  setPostFilter(
                    postFilter === 'update'
                      ? 'all'
                      : 'update'
                  )
                }
              >

                <div
                  className={
                    Styles.categoryIcon
                  }
                >
                  <FaBullhorn />
                </div>

                <div>
                  <span>
                    Updates
                  </span>

                  <strong>
                    {postCounts.update}
                  </strong>
                </div>

              </button>


              <button
                type="button"
                className={`${Styles.myPostCategory} ${
                  postFilter === 'action'
                    ? Styles.myPostCategoryActive
                    : ''
                }`}
                onClick={() =>
                  setPostFilter(
                    postFilter === 'action'
                      ? 'all'
                      : 'action'
                  )
                }
              >

                <div
                  className={
                    Styles.categoryIcon
                  }
                >
                  <FaTools />
                </div>

                <div>
                  <span>
                    Work Notices
                  </span>

                  <strong>
                    {postCounts.action}
                  </strong>
                </div>

              </button>


              <button
                type="button"
                className={`${Styles.myPostCategory} ${
                  postFilter === 'general'
                    ? Styles.myPostCategoryActive
                    : ''
                }`}
                onClick={() =>
                  setPostFilter(
                    postFilter === 'general'
                      ? 'all'
                      : 'general'
                  )
                }
              >

                <div
                  className={
                    Styles.categoryIcon
                  }
                >
                  <FaInfoCircle />
                </div>

                <div>
                  <span>
                    General
                  </span>

                  <strong>
                    {postCounts.general}
                  </strong>
                </div>
              </button>
            </div>
          </aside>

        </div>

      </main>

    </div>
  )
}