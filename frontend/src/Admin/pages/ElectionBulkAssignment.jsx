import React, { useMemo, useRef, useState } from 'react'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './ElectionBulkAssignment.module.css'

/*
 * CivicConnect — Bulk Election Representative Assignment
 *
 * UI template for:
 *   1. Select election type
 *   2. Select election year
 *   3. Upload CSV
 *   4. Validate rows
 *   5. Preview changes
 *   6. Apply all assignments in one operation
 *
 * IMPORTANT:
 * The current backend contains the individual
 * /admin/constituencies/<id>/assign/ endpoint, but a bulk
 * transaction endpoint is not present in the supplied README.
 *
 * Therefore this template intentionally does NOT loop through
 * the individual assignment endpoint. Connect handleApply()
 * to the future bulk endpoint after it is implemented.
 */

const ELECTION_TYPES = [
  {
    value: 'LEGISLATIVE_ASSEMBLY',
    label: 'Legislative Assembly',
    shortLabel: 'Niyama Sabha',
  },
  {
    value: 'LOK_SABHA',
    label: 'Lok Sabha',
    shortLabel: 'Lok Sabha',
  },
  {
    value: 'LOCAL_BODY',
    label: 'Local Body',
    shortLabel: 'Local Body',
  },
]

const REQUIRED_COLUMNS = [
  'constituency_id',
  'representative_name',
  'email',
]

const PAGE_SIZE = 20

export default function ElectionBulkAssignment() {
  const fileInputRef = useRef(null)

  const [electionType, setElectionType] = useState('LEGISLATIVE_ASSEMBLY')
  const [electionYear, setElectionYear] = useState(
    new Date().getFullYear().toString()
  )

  const [file, setFile] = useState(null)
  const [rows, setRows] = useState([])

  const [step, setStep] = useState('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const selectedElection = useMemo(
    () =>
      ELECTION_TYPES.find(
        (item) => item.value === electionType
      ),
    [electionType]
  )

  const validCount = rows.filter(
    (row) => row.status === 'valid'
  ).length

  const invalidCount = rows.filter(
    (row) => row.status === 'invalid'
  ).length

  const replacementCount = rows.filter(
    (row) => row.status === 'valid' && row.currentRepresentative
  ).length

  const unassignedCount = rows.filter(
    (row) => row.status === 'valid' && !row.currentRepresentative
  ).length

  const filteredRows = useMemo(() => {
    const value = search.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        !value ||
        row.constituencyName?.toLowerCase().includes(value) ||
        row.representativeName?.toLowerCase().includes(value) ||
        row.email?.toLowerCase().includes(value) ||
        String(row.constituencyId).includes(value)

      const matchesStatus =
        statusFilter === 'all' ||
        row.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / PAGE_SIZE)
  )

  const visibleRows = filteredRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  const parseCsvLine = (line) => {
    const result = []
    let current = ''
    let quoted = false

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]

      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          quoted = !quoted
        }
      } else if (char === ',' && !quoted) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  const parseCsv = (text) => {
    const lines = text
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter((line) => line.trim())

    if (lines.length < 2) {
      throw new Error(
        'The CSV must contain a header row and at least one data row.'
      )
    }

    const headers = parseCsvLine(lines[0]).map((header) =>
      header.toLowerCase().trim()
    )

    const missingColumns = REQUIRED_COLUMNS.filter(
      (column) => !headers.includes(column)
    )

    if (missingColumns.length) {
      throw new Error(
        `Missing required column(s): ${missingColumns.join(', ')}`
      )
    }

    return lines.slice(1).map((line, index) => {
      const values = parseCsvLine(line)
      const record = {}

      headers.forEach((header, headerIndex) => {
        record[header] = values[headerIndex] || ''
      })

      return {
        rowNumber: index + 2,
        constituencyId: record.constituency_id,
        constituencyName:
          record.constituency_name || `Constituency #${record.constituency_id}`,
        representativeName: record.representative_name,
        email: record.email,
        currentRepresentative:
          record.current_representative || '',
        status: 'valid',
        error: '',
      }
    })
  }

  const validateRows = (parsedRows) => {
    const seenConstituencies = new Set()
    const seenEmails = new Set()

    return parsedRows.map((row) => {
      const errors = []

      if (!row.constituencyId) {
        errors.push('Constituency ID is required.')
      }

      if (!row.representativeName) {
        errors.push('Representative name is required.')
      }

      if (!row.email) {
        errors.push('Representative email is required.')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push('Invalid email address.')
      }

      if (seenConstituencies.has(row.constituencyId)) {
        errors.push('Duplicate constituency in this file.')
      }

      if (seenEmails.has(row.email.toLowerCase())) {
        errors.push('Duplicate representative email in this file.')
      }

      if (row.constituencyId) {
        seenConstituencies.add(row.constituencyId)
      }

      if (row.email) {
        seenEmails.add(row.email.toLowerCase())
      }

      return {
        ...row,
        status: errors.length ? 'invalid' : 'valid',
        error: errors.join(' '),
      }
    })
  }

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    setError('')
    setRows([])
    setPage(1)

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file.')
      return
    }

    setFile(selectedFile)

    try {
      const text = await selectedFile.text()
      const parsed = parseCsv(text)
      setRows(validateRows(parsed))
      setStep('validation')
    } catch (err) {
      console.error('CSV parsing failed:', err)
      setError(err.message || 'Could not read the CSV file.')
      setStep('upload')
    }
  }

  const handleValidate = async () => {
    if (!rows.length) {
      setError('Upload a CSV file before validating.')
      return
    }

    setLoading(true)
    setError('')

    try {
      /*
       * Future backend validation can be called here.
       *
       * Example:
       *
       * const result = await validateBulkElectionAssignment({
       *   election_type: electionType,
       *   election_year: electionYear,
       *   rows,
       * })
       *
       * setRows(result.rows)
       */

      await new Promise((resolve) => setTimeout(resolve, 350))

      const validated = validateRows(rows)
      setRows(validated)

      if (validated.some((row) => row.status === 'invalid')) {
        setStep('validation')
      } else {
        setStep('preview')
      }
    } catch (err) {
      console.error('Bulk validation failed:', err)
      setError(
        err.response?.data?.error ||
          'Could not validate the election file.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!rows.length || invalidCount > 0) {
      setError(
        'Resolve all validation errors before applying the election results.'
      )
      return
    }

    /*
     * DO NOT replace this with a loop over assignRepresentative().
     *
     * The purpose of this screen is one atomic bulk operation.
     *
     * Connect this to a future endpoint such as:
     *
     * POST /api/admin/elections/bulk-assign/
     *
     * Payload:
     * {
     *   election_type: electionType,
     *   election_year: electionYear,
     *   assignments: rows.map(row => ({
     *     constituency_id: row.constituencyId,
     *     representative_name: row.representativeName,
     *     email: row.email,
     *   }))
     * }
     *
     * The backend should validate everything first and then
     * apply all assignments inside one transaction.atomic().
     */

    setError(
      'The bulk assignment API is not connected yet. This template is ready for the bulk transaction endpoint.'
    )
  }

  const handleRemoveFile = () => {
    setFile(null)
    setRows([])
    setError('')
    setStep('upload')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadTemplate = () => {
    const csv = [
      'constituency_id,constituency_name,representative_name,email',
      '148,Aluva,John Mathew,john@example.com',
      '149,Thrikkakara,Anu Thomas,anu@example.com',
      '150,Kalamassery,Rahul Joseph,rahul@example.com',
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = 'civicconnect-election-representatives-template.csv'
    anchor.click()

    URL.revokeObjectURL(url)
  }

  const resetImport = () => {
    handleRemoveFile()
    setSearch('')
    setStatusFilter('all')
    setPage(1)
  }

  return (
    <AdminLayout>
      <div className={Styles.container}>

        {/* HEADER */}
        <div className={Styles.header}>
          <div>
            <h1>Bulk Representative Assignment</h1>
            <p>
              Update constituency representatives after an election
              in one operation.
            </p>
          </div>

          <button
            type="button"
            className={Styles.secondaryBtn}
            onClick={handleDownloadTemplate}
          >
            Download CSV Template
          </button>
        </div>

        {/* STEPPER */}
        <div className={Styles.stepper}>

          <div
            className={`${Styles.step} ${
              step === 'upload'
                ? Styles.stepActive
                : Styles.stepComplete
            }`}
          >
            <span>1</span>
            <div>
              <strong>Upload</strong>
              <small>Election file</small>
            </div>
          </div>

          <div className={Styles.stepLine} />

          <div
            className={`${Styles.step} ${
              step === 'validation'
                ? Styles.stepActive
                : step === 'preview' || step === 'complete'
                ? Styles.stepComplete
                : ''
            }`}
          >
            <span>2</span>
            <div>
              <strong>Validate</strong>
              <small>Check all rows</small>
            </div>
          </div>

          <div className={Styles.stepLine} />

          <div
            className={`${Styles.step} ${
              step === 'preview'
                ? Styles.stepActive
                : step === 'complete'
                ? Styles.stepComplete
                : ''
            }`}
          >
            <span>3</span>
            <div>
              <strong>Preview</strong>
              <small>Review changes</small>
            </div>
          </div>

          <div className={Styles.stepLine} />

          <div
            className={`${Styles.step} ${
              step === 'complete'
                ? Styles.stepActive
                : ''
            }`}
          >
            <span>4</span>
            <div>
              <strong>Apply</strong>
              <small>Update accounts</small>
            </div>
          </div>

        </div>

        {/* ELECTION DETAILS */}
        <section className={Styles.card}>

          <div className={Styles.cardHeader}>
            <div>
              <h2>Election Details</h2>
              <p>
                Select the election whose results are being imported.
              </p>
            </div>
          </div>

          <div className={Styles.formGrid}>

            <div className={Styles.inputGroup}>
              <label>Election Type</label>

              <select
                value={electionType}
                onChange={(event) => {
                  setElectionType(event.target.value)
                  resetImport()
                }}
              >
                {ELECTION_TYPES.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ))}
              </select>

              <small>
                {selectedElection?.shortLabel}
              </small>
            </div>

            <div className={Styles.inputGroup}>
              <label>Election Year</label>

              <input
                type="number"
                min="1900"
                max="2100"
                value={electionYear}
                onChange={(event) =>
                  setElectionYear(event.target.value)
                }
              />

              <small>
                Example: 2026
              </small>
            </div>

          </div>

        </section>

        {/* UPLOAD */}
        {step === 'upload' && (
          <section className={Styles.card}>

            <div className={Styles.cardHeader}>
              <div>
                <h2>Upload Election Results</h2>
                <p>
                  Upload a CSV containing the new representative
                  for each constituency.
                </p>
              </div>
            </div>

            <div
              className={Styles.uploadArea}
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <div className={Styles.uploadIcon}>
                ↑
              </div>

              <strong>
                Click to upload CSV
              </strong>

              <span>
                constituency_id, constituency_name,
                representative_name, email
              </span>

              <small>
                CSV files only
              </small>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                hidden
              />
            </div>

            {error && (
              <div className={Styles.errorBox}>
                {error}
              </div>
            )}

          </section>
        )}

        {/* VALIDATION / PREVIEW */}
        {(step === 'validation' || step === 'preview') && (
          <>
            {/* FILE INFO */}
            <section className={Styles.card}>

              <div className={Styles.fileSummary}>

                <div>
                  <span className={Styles.fileIcon}>
                    CSV
                  </span>

                  <div>
                    <strong>
                      {file?.name || 'Election results'}
                    </strong>

                    <small>
                      {rows.length} assignment rows
                    </small>
                  </div>
                </div>

                <button
                  type="button"
                  className={Styles.linkBtn}
                  onClick={handleRemoveFile}
                >
                  Remove file
                </button>

              </div>

            </section>

            {/* STATISTICS */}
            <div className={Styles.statsGrid}>

              <div className={Styles.statCard}>
                <span>Total</span>
                <strong>{rows.length}</strong>
              </div>

              <div className={Styles.statCard}>
                <span>Valid</span>
                <strong>{validCount}</strong>
              </div>

              <div className={Styles.statCard}>
                <span>Reassignments</span>
                <strong>{replacementCount}</strong>
              </div>

              <div className={Styles.statCard}>
                <span>Unassigned</span>
                <strong>{unassignedCount}</strong>
              </div>

              <div className={Styles.statCard}>
                <span>Errors</span>
                <strong>{invalidCount}</strong>
              </div>

            </div>

            {/* TABLE */}
            <section className={Styles.card}>

              <div className={Styles.cardHeader}>
                <div>
                  <h2>
                    {step === 'validation'
                      ? 'Validation Results'
                      : 'Preview Changes'}
                  </h2>

                  <p>
                    Review every constituency before applying
                    the election results.
                  </p>
                </div>

                <div className={Styles.tableControls}>

                  <div className={Styles.searchBox}>
                    <span>⌕</span>

                    <input
                      type="text"
                      placeholder="Search constituency or representative..."
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value)
                        setPage(1)
                      }}
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="all">
                      All
                    </option>
                    <option value="valid">
                      Valid
                    </option>
                    <option value="invalid">
                      Errors
                    </option>
                  </select>

                </div>
              </div>

              <div className={Styles.tableWrapper}>
                <table className={Styles.table}>

                  <thead>
                    <tr>
                      <th>Constituency</th>
                      <th>New Representative</th>
                      <th>Current Representative</th>
                      <th>Status</th>
                      <th>Message</th>
                    </tr>
                  </thead>

                  <tbody>

                    {visibleRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className={Styles.emptyCell}
                        >
                          No matching rows.
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row) => (
                        <tr key={`${row.rowNumber}-${row.constituencyId}`}>

                          <td>
                            <div className={Styles.primaryCell}>
                              <strong>
                                {row.constituencyName}
                              </strong>

                              <small>
                                ID: {row.constituencyId}
                              </small>
                            </div>
                          </td>

                          <td>
                            <div className={Styles.primaryCell}>
                              <strong>
                                {row.representativeName}
                              </strong>

                              <small>
                                {row.email}
                              </small>
                            </div>
                          </td>

                          <td>
                            {row.currentRepresentative ? (
                              <span>
                                {row.currentRepresentative}
                              </span>
                            ) : (
                              <span className={Styles.muted}>
                                — Unassigned —
                              </span>
                            )}
                          </td>

                          <td>
                            <span
                              className={
                                row.status === 'valid'
                                  ? Styles.successBadge
                                  : Styles.errorBadge
                              }
                            >
                              {row.status === 'valid'
                                ? 'Valid'
                                : 'Error'}
                            </span>
                          </td>

                          <td>
                            {row.error ? (
                              <span className={Styles.errorMessage}>
                                {row.error}
                              </span>
                            ) : row.currentRepresentative ? (
                              <span className={Styles.warningMessage}>
                                Previous account will be deactivated.
                              </span>
                            ) : (
                              <span className={Styles.successMessage}>
                                New assignment.
                              </span>
                            )}
                          </td>

                        </tr>
                      ))
                    )}

                  </tbody>

                </table>
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className={Styles.pagination}>

                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() =>
                      setPage((current) =>
                        Math.max(1, current - 1)
                      )
                    }
                  >
                    Previous
                  </button>

                  <span>
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages, current + 1)
                      )
                    }
                  >
                    Next
                  </button>

                </div>
              )}

              {error && (
                <div className={Styles.errorBox}>
                  {error}
                </div>
              )}

              {/* ACTIONS */}
              <div className={Styles.actions}>

                <button
                  type="button"
                  className={Styles.secondaryBtn}
                  onClick={resetImport}
                >
                  Cancel
                </button>

                {step === 'validation' ? (
                  <button
                    type="button"
                    className={Styles.primaryBtn}
                    onClick={handleValidate}
                    disabled={loading || !rows.length}
                  >
                    {loading
                      ? 'Validating...'
                      : 'Validate All Rows'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={Styles.primaryBtn}
                    onClick={handleApply}
                    disabled={
                      loading ||
                      !rows.length ||
                      invalidCount > 0
                    }
                  >
                    Apply Election Results
                  </button>
                )}

              </div>

            </section>

            {/* REASSIGNMENT WARNING */}
            {step === 'preview' &&
              replacementCount > 0 && (
                <section className={Styles.warningCard}>

                  <div className={Styles.warningIcon}>
                    !
                  </div>

                  <div>
                    <strong>
                      {replacementCount} existing representative
                      account(s) will be deactivated.
                    </strong>

                    <p>
                      Applying these election results will end the
                      current assignments and deactivate the previous
                      representatives' login accounts. The new
                      representatives will be activated and assigned
                      to their constituencies.
                    </p>
                  </div>

                </section>
              )}

          </>
        )}

        {/* FUTURE COMPLETION STATE */}
        {step === 'complete' && (
          <section className={Styles.successCard}>

            <div className={Styles.successIcon}>
              ✓
            </div>

            <h2>
              Election assignments completed
            </h2>

            <p>
              All representative assignments were successfully
              updated.
            </p>

            <button
              type="button"
              className={Styles.primaryBtn}
              onClick={resetImport}
            >
              Start Another Import
            </button>

          </section>
        )}

      </div>
    </AdminLayout>
  )
}
