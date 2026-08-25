import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('tracker')

  const [showForm, setShowForm] = useState(false)
  const [applications, setApplications] = useState([])
  const [editingId, setEditingId] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [formData, setFormData] = useState({
    company: '',
    position: '',
    status: 'Applied',
    date: '',
    job_url: '',
    notes: '',
  })

  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [matchResult, setMatchResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetch('https://d1u01w5wr0u1g8.cloudfront.net/applications')
      .then((response) => response.json())
      .then((data) => setApplications(data))
      .catch((error) =>
        console.error('Error fetching applications:', error)
      )
  }, [])

  function handleChange(event) {
    const { name, value } = event.target

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  function resetForm() {
    setFormData({
      company: '',
      position: '',
      status: 'Applied',
      date: '',
      job_url: '',
      notes: '',
    })

    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(application) {
    setFormData({
      company: application.company,
      position: application.position,
      status: application.status,
      date: application.date,
      job_url: application.job_url || '',
      notes: application.notes || '',
    })

    setEditingId(application.id)
    setShowForm(true)

    setTimeout(() => {
      document
        .querySelector('.application-form')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 100)
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (editingId !== null) {
      setApplications(
        applications.map((application) =>
          application.id === editingId
            ? {
                ...application,
                ...formData,
              }
            : application
        )
      )
    } else {
      const newApplication = {
        id: `demo-${Date.now()}`,
        ...formData,
      }

      setApplications([...applications, newApplication])
    }

    resetForm()
  }

  function handleDelete(id) {
    setApplications(
      applications.filter(
        (application) => application.id !== id
      )
    )
  }

  async function handleResumeMatch(event) {
    event.preventDefault()

    setAnalyzing(true)
    setMatchResult(null)

    try {
      const response = await fetch(
        'https://d1u01w5wr0u1g8.cloudfront.net/resume-match',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resume_text: resumeText,
            job_description: jobDescription,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to analyze resume')
      }

      const result = await response.json()
      setMatchResult(result)

      setTimeout(() => {
        document
          .querySelector('.match-results')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      }, 100)
    } catch (error) {
      console.error('Error analyzing resume:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const interviewCount = applications.filter(
    (application) =>
      application && application.status === 'Interview'
  ).length

  const offerCount = applications.filter(
    (application) =>
      application && application.status === 'Offer'
  ).length

  const filteredApplications = applications
    .filter(Boolean)
    .filter((application) => {
      const matchesSearch =
        application.company
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        application.position
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'All' ||
        application.status === statusFilter

      return matchesSearch && matchesStatus
    })

  return (
    <div className="app">
      <header>
        <h1>ApplyTrack</h1>
        <p>Job Application Manager</p>

        <nav className="main-nav">
          <button
            className={
              activePage === 'tracker' ? 'nav-active' : ''
            }
            onClick={() => setActivePage('tracker')}
          >
            Application Tracker
          </button>

          <button
            className={
              activePage === 'resume' ? 'nav-active' : ''
            }
            onClick={() => setActivePage('resume')}
          >
            Resume Match
          </button>
        </nav>
      </header>

      <main>
        {activePage === 'tracker' && (
          <>
            <h2>Dashboard</h2>

            <section className="stats">
              <div>
                <h3>Total Applications</h3>
                <p>{applications.length}</p>
              </div>

              <div>
                <h3>Interviews</h3>
                <p>{interviewCount}</p>
              </div>

              <div>
                <h3>Offers</h3>
                <p>{offerCount}</p>
              </div>
            </section>

            <button
              onClick={() => {
                setEditingId(null)

                setFormData({
                  company: '',
                  position: '',
                  status: 'Applied',
                  date: '',
                  job_url: '',
                  notes: '',
                })

                setShowForm(true)
              }}
            >
              Add Application
            </button>

            {showForm && (
              <section className="application-form">
                <h2>
                  {editingId !== null
                    ? 'Edit Application'
                    : 'Add New Application'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <label>
                    Company
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="e.g. Microsoft"
                      required
                    />
                  </label>

                  <label>
                    Position
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      placeholder="e.g. Software Engineer"
                      required
                    />
                  </label>

                  <label>
                    Status
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option>Applied</option>
                      <option>Interview</option>
                      <option>Offer</option>
                      <option>Rejected</option>
                    </select>
                  </label>

                  <label>
                    Application Date
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label className="full-width-field">
                    Job Posting URL
                    <input
                      type="url"
                      name="job_url"
                      value={formData.job_url}
                      onChange={handleChange}
                      placeholder="https://company.com/jobs/..."
                    />
                  </label>

                  <label className="full-width-field">
                    Notes
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Interview notes, recruiter name, next steps..."
                      rows="4"
                    />
                  </label>

                  <div className="form-buttons">
                    <button type="submit">
                      {editingId !== null
                        ? 'Update Application'
                        : 'Save Application'}
                    </button>

                    <button
                      type="button"
                      className="cancel-button"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="filters">
              <input
                type="text"
                placeholder="Search by company or position..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option>All</option>
                <option>Applied</option>
                <option>Interview</option>
                <option>Offer</option>
                <option>Rejected</option>
              </select>
            </section>

            {filteredApplications.length > 0 ? (
              <section className="application-list">
                <h2>Applications</h2>

                {filteredApplications.map((application) => (
                  <div
                    className="application-card"
                    key={application.id}
                  >
                    <div className="application-main">
                      <h3>{application.company}</h3>
                      <p>{application.position}</p>

                      {application.job_url && (
                        <p>
                          <a
                            href={application.job_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Job Posting
                          </a>
                        </p>
                      )}

                      {application.notes && (
                        <div className="application-notes">
                          <strong>Notes:</strong>
                          <p>{application.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="application-details">
                      <p>
                        <strong>Status:</strong>{' '}
                        {application.status}
                      </p>

                      <p>
                        <strong>Date:</strong>{' '}
                        {application.date}
                      </p>

                      <div className="card-buttons">
                        <button
                          className="edit-button"
                          onClick={() =>
                            handleEdit(application)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDelete(application.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            ) : (
              <p className="no-results">
                No applications found.
              </p>
            )}
          </>
        )}

        {activePage === 'resume' && (
          <section className="resume-match-page">
            <div className="resume-match-heading">
              <h2>Resume Match</h2>
              <p>
                Compare your resume with a job description
                to see how well your experience matches the role.
              </p>
            </div>

            <form
              className="resume-match-form"
              onSubmit={handleResumeMatch}
            >
              <div className="resume-text-boxes">
                <label>
                  Your Resume
                  <textarea
                    value={resumeText}
                    onChange={(event) =>
                      setResumeText(event.target.value)
                    }
                    placeholder="Paste your resume text here..."
                    rows="14"
                    required
                  />
                </label>

                <label>
                  Job Description
                  <textarea
                    value={jobDescription}
                    onChange={(event) =>
                      setJobDescription(event.target.value)
                    }
                    placeholder="Paste the job description here..."
                    rows="14"
                    required
                  />
                </label>
              </div>

              <button
                className="analyze-button"
                type="submit"
                disabled={analyzing}
              >
                {analyzing
                  ? 'Analyzing...'
                  : 'Analyze Match'}
              </button>
            </form>

            {matchResult && (
              <section className="match-results">
                <div className="match-score">
                  <span>{matchResult.score}%</span>
                  <p>Overall Match</p>
                </div>

                <div className="score-breakdown">
                  <div>
                    <h3>Technical Skills</h3>
                    <p>{matchResult.technical_score}%</p>
                  </div>

                  <div>
                    <h3>Keywords</h3>
                    <p>{matchResult.keyword_score}%</p>
                  </div>

                  <div>
                    <h3>Development Concepts</h3>
                    <p>{matchResult.concept_score}%</p>
                  </div>

                  <div>
                    <h3>Role Relevance</h3>
                    <p>{matchResult.role_score}%</p>
                  </div>
                </div>

                <div className="skill-results">
                  <div className="matched-skills">
                    <h3>Matched Skills</h3>

                    {matchResult.matched_skills.length > 0 ? (
                      <ul>
                        {matchResult.matched_skills.map(
                          (skill) => (
                            <li key={skill}>
                              ✓ {skill}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p>No matching skills found.</p>
                    )}
                  </div>

                  <div className="missing-skills">
                    <h3>Missing Skills</h3>

                    {matchResult.missing_skills.length > 0 ? (
                      <ul>
                        {matchResult.missing_skills.map(
                          (skill) => (
                            <li key={skill}>
                              ✕ {skill}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p>No missing skills found.</p>
                    )}
                  </div>
                </div>

                <div className="resume-suggestions">
                  <h3>Suggestions</h3>

                  {matchResult.suggestions &&
                  matchResult.suggestions.length > 0 ? (
                    <ul>
                      {matchResult.suggestions.map(
                        (suggestion, index) => (
                          <li key={index}>
                            {suggestion}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      No additional suggestions.
                    </p>
                  )}
                </div>
              </section>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App