import { useState } from 'react'
import { FaBullhorn,FaExclamationCircle,FaCheckCircle,FaPaperPlane} from 'react-icons/fa'
import MyWardSidebar from '../../components/MyWardSidebar'
import Styles from './MyWard.module.css'
import { createBranchMyWardPost,} from '../../../api/services/Branch/MyWard'
import BranchSidebar from '../../components/BranchSidebar'


export default function BranchCreateMyWardPost() {

  /* STATE */
  const [form, setForm] = useState({
    post_type: 'update',
    title: '',
    description: '',
  })

  const [publishing, setPublishing] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')


  /* CHANGE  */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }


  /* ============================================================
     ERROR MESSAGE
  ============================================================ */

  const extractError = (err) => {
    const data = err?.response?.data

    if (!data) {
      return 'Unable to publish post.'
    }

    if (typeof data === 'string') {
      return data
    }

    if (data.detail) {
      return data.detail
    }

    if (data.message) {
      return data.message
    }

    if (data.error) {
      return data.error
    }

    /*
     * Handle DRF serializer errors:
     *
     * {
     *   title: ["This field is required."]
     * }
     */
    for (const value of Object.values(data)) {

      if (
        Array.isArray(value) &&
        value.length
      ) {
        return String(value[0])
      }

      if (typeof value === 'string') {
        return value
      }

    }

    return 'Unable to publish post.'
  }


  /* ============================================================
     SUBMIT
  ============================================================ */

  const submit = async (event) => {
    event.preventDefault()

    const title =
      form.title.trim()

    const description =
      form.description.trim()


    if (!title) {
      setError(
        'Please enter a title.'
      )

      return
    }


    if (!description) {
      setError(
        'Please enter a description.'
      )

      return
    }


    try {

      setPublishing(true)
      setError('')
      setSuccess('')


      const result =
        await createBranchMyWardPost({
          post_type:
            form.post_type,

          title,

          description,
        })


      console.log(
        'Branch MyWard post created:',
        result
      )


      setSuccess(
        'Update published successfully.'
      )


      setForm({
        post_type: 'update',
        title: '',
        description: '',
      })

    } catch (err) {

      console.error(
        'Failed to publish Branch MyWard post:',
        err
      )


      setError(
        extractError(err)
      )

    } finally {

      setPublishing(false)

    }
  }


  /* UI */

  return (
    <div className={Styles.page}>

      <BranchSidebar />


      <main className={Styles.content}>

        {/* HEADER */}

        <div className={Styles.header}>
          <div>
            <div className={Styles.eyebrow}>
              <FaBullhorn />
              MyWard
            </div>
            <h1>Publish Update</h1>
            <p>
              Publish alerts, locality updates
              and public work notices for the
              area served by your branch.
            </p>
          </div>
        </div>


        {/* FORM*/}
        <form className={Styles.card} onSubmit={submit}>

          {/* POST TYPE */}
          <div className={Styles.group}>
            <label className={Styles.label} htmlFor="branch-post-type">Post type</label>
            <select
              id="branch-post-type"
              name="post_type"
              className={Styles.select}
              value={form.post_type}
              onChange={handleChange}
              disabled={publishing}
            >

              <option value="alert">
                Alert
              </option>

              <option value="update">
                Update
              </option>

              <option value="action">
                Action / Work Notice
              </option>

              <option value="general">
                General
              </option>

            </select>

          </div>


          {/* TITLE */}

          <div className={Styles.group}>

            <label
              className={Styles.label}
              htmlFor="branch-post-title"
            >
              Title
            </label>


            <input
              id="branch-post-title"
              name="title"
              type="text"
              className={Styles.input}
              value={form.title}
              onChange={handleChange}
              placeholder="Enter update title"
              maxLength={200}
              disabled={publishing}
              required
            />

          </div>


          {/* DESCRIPTION */}

          <div className={Styles.group}>

            <label
              className={Styles.label}
              htmlFor="branch-post-description"
            >
              Description
            </label>


            <textarea
              id="branch-post-description"
              name="description"
              className={Styles.textarea}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the alert, update or work notice..."
              rows={7}
              disabled={publishing}
              required
            />

          </div>


          {/* ====================================================
              SUCCESS
          ==================================================== */}

          {success && (

            <div className={Styles.successMessage}>

              <FaCheckCircle />

              <span>
                {success}
              </span>

            </div>

          )}


          {/* ====================================================
              ERROR
          ==================================================== */}

          {error && (

            <div className={Styles.errorMessage}>

              <FaExclamationCircle />

              <span>
                {error}
              </span>

            </div>

          )}


          {/* ====================================================
              SUBMIT
          ==================================================== */}

          <div className={Styles.formActions}>

            <button
              type="submit"
              className={Styles.primary}
              disabled={publishing}
            >

              <FaPaperPlane />

              {publishing
                ? 'Publishing...'
                : 'Publish Update'}

            </button>

          </div>

        </form>

      </main>

    </div>
  )
}