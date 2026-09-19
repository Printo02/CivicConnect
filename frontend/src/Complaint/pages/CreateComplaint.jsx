import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Styles from '../components/module.css/CreateComplaint.module.css'
import UserLayout from '../../User/components/UserLayout'
// import { createComplaint } from '../../api/services/Complaint/complaintService'

function CreateComplaint ()  {

  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    target_type: '',
    target_representative: '',
    target_branch: '',
    title: '',
    description: '',
    original_language: 'en',
    locality: '',
    latitude: '',
    longitude: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  // HANDLE INPUT
  const handleChange = (e) => {

    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    setError('')
  }


  // --------------------------------------------------
  // TARGET TYPE
  // --------------------------------------------------

  const handleTargetTypeChange = (e) => {

    const value = e.target.value

    setFormData((prev) => ({
      ...prev,
      target_type: value,
      target_representative:
        value === 'representative'
          ? prev.target_representative
          : '',
      target_branch:
        value === 'branch'
          ? prev.target_branch
          : '',
    }))

    setError('')
  }


  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  const handleSubmit = async (e) => {

    e.preventDefault()

    setError('')
    setSuccess('')

    // Basic validation
    if (!formData.target_type) {
      setError('Please select a complaint target.')
      return
    }

    if (
      formData.target_type === 'representative' &&
      !formData.target_representative
    ) {
      setError('Representative ID is required.')
      return
    }

    if (
      formData.target_type === 'branch' &&
      !formData.target_branch
    ) {
      setError('Branch ID is required.')
      return
    }

    if (!formData.title.trim()) {
      setError('Complaint title is required.')
      return
    }

    if (!formData.description.trim()) {
      setError('Complaint description is required.')
      return
    }

    try {

      setLoading(true)

      const payload = {
        target_type: formData.target_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        original_language: formData.original_language,
        locality: formData.locality.trim(),
        latitude:
          formData.latitude === ''
            ? null
            : formData.latitude,
        longitude:
          formData.longitude === ''
            ? null
            : formData.longitude,
      }

      if (formData.target_type === 'representative') {
        payload.target_representative =
          Number(formData.target_representative)
      }

      if (formData.target_type === 'branch') {
        payload.target_branch =
          Number(formData.target_branch)
      }

      const response = await createComplaint(payload)

      setSuccess('Complaint created successfully.')

      // Reset form
      setFormData({
        target_type: '',
        target_representative: '',
        target_branch: '',
        title: '',
        description: '',
        original_language: 'en',
        locality: '',
        latitude: '',
        longitude: '',
      })

      console.log('Created complaint:', response)

    } catch (err) {

      console.error('Create complaint failed:', err)

      if (err.response?.data) {
        setError(
          typeof err.response.data === 'string'
            ? err.response.data
            : JSON.stringify(err.response.data)
        )
      } else {
        setError('Failed to create complaint.')
      }

    } finally {
      setLoading(false)
    }
  }


  return (
    <UserLayout title="Create Complaint">

      <div className={Styles.container}>

        <div className={Styles.header}>
          <h2>Create Complaint</h2>

          <button
            type="button"
            className={Styles.backBtn}
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>


        {error && (
          <div className={Styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div className={Styles.success}>
            {success}
          </div>
        )}


        <form
          className={Styles.form}
          onSubmit={handleSubmit}
        >

          {/* TARGET TYPE */}

          <div className={Styles.formGroup}>

            <label>
              Complaint Target
            </label>

            <select
              name="target_type"
              value={formData.target_type}
              onChange={handleTargetTypeChange}
            >

              <option value="">
                Select target
              </option>

              <option value="representative">
                Representative
              </option>

              <option value="branch">
                Branch
              </option>

            </select>

          </div>


          {/* REPRESENTATIVE */}

          {formData.target_type === 'representative' && (

            <div className={Styles.formGroup}>

              <label>
                Representative ID
              </label>

              <input
                type="number"
                name="target_representative"
                value={formData.target_representative}
                onChange={handleChange}
                placeholder="Enter representative ID"
              />

            </div>

          )}


          {/* BRANCH */}

          {formData.target_type === 'branch' && (

            <div className={Styles.formGroup}>

              <label>
                Branch ID
              </label>

              <input
                type="number"
                name="target_branch"
                value={formData.target_branch}
                onChange={handleChange}
                placeholder="Enter branch ID"
              />

            </div>

          )}


          {/* TITLE */}

          <div className={Styles.formGroup}>

            <label>
              Complaint Title
            </label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter complaint title"
            />

          </div>


          {/* DESCRIPTION */}

          <div className={Styles.formGroup}>

            <label>
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your complaint"
              rows="6"
            />

          </div>


          {/* LANGUAGE */}

          <div className={Styles.formGroup}>

            <label>
              Language
            </label>

            <select
              name="original_language"
              value={formData.original_language}
              onChange={handleChange}
            >

              <option value="en">
                English
              </option>

              <option value="ml">
                Malayalam
              </option>

            </select>

          </div>


          {/* LOCALITY */}

          <div className={Styles.formGroup}>

            <label>
              Locality
            </label>

            <input
              type="text"
              name="locality"
              value={formData.locality}
              onChange={handleChange}
              placeholder="Enter locality"
            />

          </div>


          {/* LATITUDE */}

          <div className={Styles.formGroup}>

            <label>
              Latitude
            </label>

            <input
              type="number"
              step="any"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="Latitude"
            />

          </div>


          {/* LONGITUDE */}

          <div className={Styles.formGroup}>

            <label>
              Longitude
            </label>

            <input
              type="number"
              step="any"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="Longitude"
            />

          </div>


          {/* SUBMIT */}

          <button
            type="submit"
            className={Styles.submitBtn}
            disabled={loading}
          >

            {loading
              ? 'Creating...'
              : 'Submit Complaint'
            }

          </button>

        </form>

      </div>

    </UserLayout>
  )
}

export default CreateComplaint

