import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import './App.css'

// ResumeForge keeps API keys on the FastAPI server, never in this frontend.
const STORAGE_KEY = 'resumeforge-draft'

type Section = 'profile' | 'summary' | 'experience' | 'projects' | 'education' | 'skills' | 'certifications'
type Template = 'modern' | 'classic'
type Experience = { id: string; title: string; company: string; location: string; start: string; end: string; description: string }
type Project = { id: string; name: string; technologies: string; link: string; description: string }
type Education = { id: string; institution: string; degree: string; location: string; startYear: string; endYear: string; details: string }
type Certification = { id: string; name: string; issuer: string; year: string; link: string }

type Resume = {
  name: string
  role: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  portfolio: string
  summary: string
  skills: string
  experience: Experience[]
  projects: Project[]
  education: Education[]
  certifications: Certification[]
  template: Template
}

const blank: Resume = {
  name: '', role: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '',
  summary: '', skills: '', experience: [], projects: [], education: [], certifications: [], template: 'modern',
}

const uid = () => crypto.randomUUID()
const str = (value: unknown) => typeof value === 'string' ? value : ''
const hasText = (value: string) => value.trim().length > 0

// Retains information from the earlier ResumeForge frontend, including its single-project fields.
function readSavedResume(): Resume {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return blank
    const data: Record<string, unknown> = JSON.parse(raw)
    if (!data || typeof data !== 'object' || Array.isArray(data)) return blank

    const oldProject = str(data.projectName) || str(data.projectDescription)
      ? [{ id: uid(), name: str(data.projectName), technologies: '', link: '', description: str(data.projectDescription) }]
      : []
    const mapped = (key: string) => Array.isArray(data[key]) ? data[key] as Record<string, unknown>[] : []
    const experience: Experience[] = mapped('experience').map((x) => ({
      id: str(x.id) || uid(), title: str(x.title), company: str(x.company), location: str(x.location),
      start: str(x.start), end: str(x.end), description: str(x.description),
    }))
    const projects: Project[] = Array.isArray(data.projects)
      ? mapped('projects').map((x) => ({
          id: str(x.id) || uid(), name: str(x.name), technologies: str(x.technologies),
          link: str(x.link), description: str(x.description),
        }))
      : oldProject
    const education: Education[] = mapped('education').map((x) => ({
      id: str(x.id) || uid(), institution: str(x.institution), degree: str(x.degree) || str(x.qualification),
      location: str(x.location), startYear: str(x.startYear), endYear: str(x.endYear), details: str(x.details),
    }))
    const certifications: Certification[] = mapped('certifications').map((x) => ({
      id: str(x.id) || uid(), name: str(x.name), issuer: str(x.issuer), year: str(x.year), link: str(x.link),
    }))
    return {
      name: str(data.name), role: str(data.role), email: str(data.email), phone: str(data.phone),
      location: str(data.location), linkedin: str(data.linkedin), github: str(data.github), portfolio: str(data.portfolio),
      summary: str(data.summary), skills: str(data.skills), experience, projects, education, certifications,
      template: data.template === 'classic' ? 'classic' : 'modern',
    }
  } catch {
    return blank
  }
}

const sections: { id: Section; title: string; short: string; number: string }[] = [
  { id: 'profile', title: 'Personal details', short: 'Contact & links', number: '01' },
  { id: 'summary', title: 'Professional summary', short: 'Your introduction', number: '02' },
  { id: 'experience', title: 'Work experience', short: 'Roles & accomplishments', number: '03' },
  { id: 'projects', title: 'Projects', short: 'What you built', number: '04' },
  { id: 'education', title: 'Education', short: 'Degrees & institutions', number: '05' },
  { id: 'skills', title: 'Technical skills', short: 'Languages & tools', number: '06' },
  { id: 'certifications', title: 'Certifications', short: 'Optional credentials', number: '07' },
]

function Field({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; hint?: string
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 5, hint }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number; hint?: string
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} />
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  )
}

function EntryCard({ title, onRemove, children }: { title: string; onRemove: () => void; children: ReactNode }) {
  return (
    <div className="entry-card">
      <div className="entry-head">
        <strong>{title}</strong>
        <button type="button" className="text-button danger" onClick={onRemove} aria-label={`Remove ${title}`}>Remove ×</button>
      </div>
      {children}
    </div>
  )
}

const lines = (text: string) => text.split(/\r?\n/).map((s) => s.trim().replace(/^[•\-*]\s*/, '')).filter(Boolean)
const dateRange = (a: string, b: string) => [a.trim(), b.trim()].filter(Boolean).join(' – ')

function ResumePreview({ resume }: { resume: Resume }) {
  const contacts = [resume.email, resume.phone, resume.location].filter(hasText)
  const links = [resume.linkedin, resume.github, resume.portfolio].filter(hasText)
  const populatedExperience = resume.experience.filter((x) => [x.title, x.company, x.description].some(hasText))
  const populatedProjects = resume.projects.filter((x) => [x.name, x.description, x.technologies].some(hasText))
  const populatedEducation = resume.education.filter((x) => [x.degree, x.institution].some(hasText))
  const populatedCertifications = resume.certifications.filter((x) => [x.name, x.issuer].some(hasText))
  const hasContent = hasText(resume.summary) || hasText(resume.skills) || populatedExperience.length > 0 || populatedProjects.length > 0 || populatedEducation.length > 0 || populatedCertifications.length > 0

  return (
    <article className={`resume-page ${resume.template}`} aria-label="Resume document">
      <header className="r-header">
        <h1>{resume.name.trim() || 'YOUR NAME'}</h1>
        {hasText(resume.role) && <div className="r-role">{resume.role}</div>}
        {contacts.length > 0 && <div className="r-contacts">{contacts.join('  |  ')}</div>}
        {links.length > 0 && <div className="r-links">{links.join('  |  ')}</div>}
      </header>

      {hasText(resume.summary) && (
        <section className="r-section"><h2>Professional Summary</h2><p>{resume.summary.trim()}</p></section>
      )}

      {populatedExperience.length > 0 && (
        <section className="r-section">
          <h2>Experience</h2>
          {populatedExperience.map((x) => (
            <div className="r-entry" key={x.id}>
              <div className="r-entry-top"><strong>{x.title || 'Position'}{x.company ? ` · ${x.company}` : ''}</strong><span>{dateRange(x.start, x.end)}</span></div>
              {hasText(x.location) && <div className="r-subline">{x.location}</div>}
              {lines(x.description).length > 0 && <ul>{lines(x.description).map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}

      {populatedProjects.length > 0 && (
        <section className="r-section">
          <h2>Projects</h2>
          {populatedProjects.map((x) => (
            <div className="r-entry" key={x.id}>
              <div className="r-entry-top"><strong>{x.name || 'Project'}</strong>{hasText(x.link) && <span className="r-project-link">{x.link}</span>}</div>
              {hasText(x.technologies) && <div className="r-subline">{x.technologies}</div>}
              {lines(x.description).length > 0 && <ul>{lines(x.description).map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}

      {populatedEducation.length > 0 && (
        <section className="r-section">
          <h2>Education</h2>
          {populatedEducation.map((x) => (
            <div className="r-entry" key={x.id}>
              <div className="r-entry-top"><strong>{x.degree || 'Qualification'}</strong><span>{dateRange(x.startYear, x.endYear)}</span></div>
              <div className="r-subline">{[x.institution, x.location].filter(hasText).join(' · ')}</div>
              {hasText(x.details) && <p>{x.details}</p>}
            </div>
          ))}
        </section>
      )}

      {hasText(resume.skills) && (
        <section className="r-section">
          <h2>Technical Skills</h2>
          {lines(resume.skills).map((line, index) => {
            const separator = line.indexOf(':')
            return <p className="r-skill" key={index}>{separator > 0 ? <><strong>{line.slice(0, separator)}:</strong>{line.slice(separator + 1)}</> : line}</p>
          })}
        </section>
      )}

      {populatedCertifications.length > 0 && (
        <section className="r-section">
          <h2>Certifications</h2>
          {populatedCertifications.map((x) => (
            <div className="r-entry r-cert" key={x.id}>
              <div className="r-entry-top"><strong>{x.name || 'Certification'}</strong><span>{x.year}</span></div>
              {[x.issuer, x.link].some(hasText) && <div className="r-subline">{[x.issuer, x.link].filter(hasText).join(' · ')}</div>}
            </div>
          ))}
        </section>
      )}

      {!hasContent && <p className="r-placeholder">Your resume preview will appear here as you add details.</p>}
    </article>
  )
}

function App() {
  const [resume, setResume] = useState<Resume>(readSavedResume)
  const [active, setActive] = useState<Section>('profile')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState<{ id: string; original: string; text: string } | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(resume)) }
    catch { setNotice('Browser storage is unavailable. Download a draft backup to avoid losing changes.') }
  }, [resume])

  function edit<K extends keyof Resume>(key: K, value: Resume[K]) {
    setResume((previous) => ({ ...previous, [key]: value }))
    setNotice('')
  }

  function updateExperience(id: string, patch: Partial<Experience>) {
    edit('experience', resume.experience.map((x) => x.id === id ? { ...x, ...patch } : x))
  }
  function updateProject(id: string, patch: Partial<Project>) {
    edit('projects', resume.projects.map((x) => x.id === id ? { ...x, ...patch } : x))
    if (aiSuggestion?.id === id) setAiSuggestion(null)
  }
  function updateEducation(id: string, patch: Partial<Education>) {
    edit('education', resume.education.map((x) => x.id === id ? { ...x, ...patch } : x))
  }
  function updateCertification(id: string, patch: Partial<Certification>) {
    edit('certifications', resume.certifications.map((x) => x.id === id ? { ...x, ...patch } : x))
  }

  async function improveProject(project: Project) {
    const description = project.description.trim()
    if (description.length < 10 || description.length > 2000) {
      setNotice('Enter a project description between 10 and 2,000 characters first.')
      return
    }
    if (lines(description).length > 1) {
      setNotice('AI improves one bullet at a time. Keep one bullet in this field when using AI.')
      return
    }
    setBusyId(project.id)
    setAiSuggestion(null)
    setNotice('')
    try {
      const response = await fetch('/api/ai/improve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      let result: { improved_bullet?: string; detail?: string } = {}
      try { result = await response.json() } catch { /* Handle non-JSON server errors below. */ }
      if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : `Backend returned HTTP ${response.status}`)
      if (!hasText(result.improved_bullet || '')) throw new Error('Gemini returned an empty result.')
      setAiSuggestion({ id: project.id, original: project.description, text: result.improved_bullet!.trim() })
    } catch (error) {
      setNotice(error instanceof TypeError
        ? 'Could not reach FastAPI. Make sure the backend is running on http://127.0.0.1:8000.'
        : error instanceof Error ? error.message : 'The AI request failed.')
    } finally {
      setBusyId(null)
    }
  }

  function acceptSuggestion() {
    if (!aiSuggestion) return
    const project = resume.projects.find((x) => x.id === aiSuggestion.id)
    if (!project || project.description !== aiSuggestion.original) {
      setNotice('Your description changed since the AI request. Generate a new suggestion.')
      setAiSuggestion(null)
      return
    }
    updateProject(aiSuggestion.id, { description: aiSuggestion.text })
    setAiSuggestion(null)
    setNotice('AI suggestion applied. Review the wording for accuracy.')
  }

  function downloadDraft() {
    const file = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resumeforge-draft.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function resetResume() {
    if (window.confirm('Clear all resume details saved in this browser? Download a backup first if needed.')) {
      setResume({ ...blank })
      setAiSuggestion(null)
      setNotice('Draft cleared.')
      setActive('profile')
    }
  }

  const progress = useMemo(() => [
    !!resume.name.trim(), !!resume.email.trim(), !!resume.summary.trim(),
    resume.experience.some((x) => hasText(x.title) && hasText(x.company)) || resume.projects.some((x) => hasText(x.name) && hasText(x.description)),
    resume.education.some((x) => hasText(x.institution) && hasText(x.degree)),
    hasText(resume.skills),
  ].filter(Boolean).length, [resume])
  const completion = Math.round((progress / 6) * 100)
  const sectionInfo = sections.find((x) => x.id === active)!

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo"><div className="logo-mark">R<span>✦</span></div><div><strong>ResumeForge</strong><small>AI RESUME STUDIO</small></div></div>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Resume sections">
          {sections.map((section) => (
            <button type="button" key={section.id} className={`nav-item ${active === section.id ? 'selected' : ''}`} onClick={() => setActive(section.id)}>
              <span className="nav-number">{section.number}</span><span className="nav-text"><strong>{section.title}</strong><small>{section.short}</small></span><span className="nav-arrow">›</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom"><span className="online-dot" /> Free to build · Saved in your browser</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="crumbs">Workspace <span>/</span> Resume Builder</div>
          <div className="top-actions">
            <span className="saved-indicator"><span className="online-dot" /> Autosave on</span>
            <button className="btn subtle" type="button" onClick={downloadDraft}>↓ Backup JSON</button>
            <button className="btn primary" type="button" onClick={() => window.print()}>↗ Export PDF</button>
          </div>
        </header>

        <div className="workspace">
          <div className="workspace-intro">
            <div><div className="eyebrow">✦ YOUR NEXT OPPORTUNITY STARTS HERE</div><h1>Build your best resume.</h1><p>Write with confidence, refine with Gemini, and export an ATS-friendly document.</p></div>
            <button className="btn ghost reset-button" type="button" onClick={resetResume}>↺ Start over</button>
          </div>

          <div className="builder-grid">
            <section className="editor-column" aria-label="Resume editor">
              <div className="editor-card">
                <div className="editor-title-row"><div><div className="step-label">SECTION {sectionInfo.number} OF 07</div><h2>{sectionInfo.title}</h2><p>{sectionInfo.short}</p></div><span className="step-pill">Edit details</span></div>

                {active === 'profile' && (
                  <div className="field-stack">
                    <div className="two-fields">
                      <Field label="Full name" value={resume.name} onChange={(v) => edit('name', v)} placeholder="e.g. Priya Sharma" />
                      <Field label="Professional headline" value={resume.role} onChange={(v) => edit('role', v)} placeholder="e.g. Software Engineer" />
                    </div>
                    <div className="two-fields">
                      <Field label="Email" type="email" value={resume.email} onChange={(v) => edit('email', v)} placeholder="name@example.com" />
                      <Field label="Phone" type="tel" value={resume.phone} onChange={(v) => edit('phone', v)} placeholder="+91 ..." />
                    </div>
                    <Field label="City / Location" value={resume.location} onChange={(v) => edit('location', v)} placeholder="e.g. Greater Noida, India" />
                    <div className="subheading">Online profiles <span>(optional)</span></div>
                    <Field label="LinkedIn" value={resume.linkedin} onChange={(v) => edit('linkedin', v)} placeholder="linkedin.com/in/your-name" />
                    <Field label="GitHub" value={resume.github} onChange={(v) => edit('github', v)} placeholder="github.com/your-name" />
                    <Field label="Portfolio / Website" value={resume.portfolio} onChange={(v) => edit('portfolio', v)} placeholder="yourportfolio.com" />
                  </div>
                )}

                {active === 'summary' && (
                  <div className="field-stack">
                    <div className="tip-card"><strong>Writing tip</strong><p>Use 2–3 direct sentences about your skills, focus, and strengths. Avoid unsupported claims and generic buzzwords.</p></div>
                    <TextArea label="Professional summary" value={resume.summary} onChange={(v) => edit('summary', v)} rows={9} placeholder="Computer Science student with experience building REST APIs and developing data-driven applications..." />
                    <div className="micro-note">We won't invent achievements or numbers for your resume.</div>
                  </div>
                )}

                {active === 'experience' && (
                  <div className="field-stack">
                    <div className="tip-card"><strong>Highlight your impact</strong><p>Add each responsibility or accomplishment on a separate line. The preview turns them into standard resume bullets.</p></div>
                    {resume.experience.map((x, i) => (
                      <EntryCard key={x.id} title={`Experience ${i + 1}`} onRemove={() => edit('experience', resume.experience.filter((item) => item.id !== x.id))}>
                        <div className="two-fields"><Field label="Job title" value={x.title} onChange={(v) => updateExperience(x.id, { title: v })} placeholder="Backend Developer Intern" /><Field label="Company" value={x.company} onChange={(v) => updateExperience(x.id, { company: v })} placeholder="Company name" /></div>
                        <Field label="Location / Remote" value={x.location} onChange={(v) => updateExperience(x.id, { location: v })} placeholder="Remote" />
                        <div className="two-fields"><Field label="Start date" value={x.start} onChange={(v) => updateExperience(x.id, { start: v })} placeholder="Jun 2026" /><Field label="End date" value={x.end} onChange={(v) => updateExperience(x.id, { end: v })} placeholder="Aug 2026 / Present" /></div>
                        <TextArea label="Responsibilities / achievements" rows={5} value={x.description} onChange={(v) => updateExperience(x.id, { description: v })} placeholder={'Built REST APIs for internal services\nIntegrated database queries for application features'} hint="One bullet per line. Only include work you actually did." />
                      </EntryCard>
                    ))}
                    <button type="button" className="add-card" onClick={() => edit('experience', [...resume.experience, { id: uid(), title: '', company: '', location: '', start: '', end: '', description: '' }])}>＋ Add experience</button>
                  </div>
                )}

                {active === 'projects' && (
                  <div className="field-stack">
                    <div className="tip-card"><strong>Make your projects count</strong><p>Explain what you built, the technologies you used, and your contribution. AI can polish one description without adding facts.</p></div>
                    {resume.projects.map((x, i) => (
                      <EntryCard key={x.id} title={`Project ${i + 1}`} onRemove={() => { edit('projects', resume.projects.filter((item) => item.id !== x.id)); if (aiSuggestion?.id === x.id) setAiSuggestion(null) }}>
                        <Field label="Project name" value={x.name} onChange={(v) => updateProject(x.id, { name: v })} placeholder="AI-Based Pothole Detection System" />
                        <Field label="Technology stack" value={x.technologies} onChange={(v) => updateProject(x.id, { technologies: v })} placeholder="Python, FastAPI, YOLO, PostgreSQL" />
                        <Field label="Project / GitHub link (optional)" value={x.link} onChange={(v) => updateProject(x.id, { link: v })} placeholder="github.com/your-name/project" />
                        <TextArea label="Project description" rows={5} value={x.description} onChange={(v) => updateProject(x.id, { description: v })} placeholder="Developed a pothole detection API using FastAPI..." hint="One line for AI improvement; multiple lines become separate bullets in the preview." />
                        <button className="btn ai" type="button" disabled={busyId !== null} onClick={() => void improveProject(x)}>{busyId === x.id ? '✦ Improving...' : '✦ Improve with Gemini AI'}</button>
                        {aiSuggestion?.id === x.id && (
                          <div className="suggestion"><div className="suggestion-head">✦ AI suggestion <span>Review before applying</span></div><p>{aiSuggestion.text}</p><div className="suggestion-actions"><button type="button" className="btn primary" onClick={acceptSuggestion}>Use this wording</button><button type="button" className="btn subtle" onClick={() => setAiSuggestion(null)}>Discard</button></div></div>
                        )}
                      </EntryCard>
                    ))}
                    <button type="button" className="add-card" onClick={() => edit('projects', [...resume.projects, { id: uid(), name: '', technologies: '', link: '', description: '' }])}>＋ Add project</button>
                  </div>
                )}

                {active === 'education' && (
                  <div className="field-stack">
                    {resume.education.map((x, i) => (
                      <EntryCard key={x.id} title={`Education ${i + 1}`} onRemove={() => edit('education', resume.education.filter((item) => item.id !== x.id))}>
                        <Field label="Institution / University" value={x.institution} onChange={(v) => updateEducation(x.id, { institution: v })} placeholder="University name" />
                        <Field label="Degree / Qualification" value={x.degree} onChange={(v) => updateEducation(x.id, { degree: v })} placeholder="B.Tech in Computer Science and Engineering" />
                        <Field label="Location (optional)" value={x.location} onChange={(v) => updateEducation(x.id, { location: v })} placeholder="Greater Noida, India" />
                        <div className="two-fields"><Field label="Start year" value={x.startYear} onChange={(v) => updateEducation(x.id, { startYear: v })} placeholder="2024" /><Field label="End / expected year" value={x.endYear} onChange={(v) => updateEducation(x.id, { endYear: v })} placeholder="2028" /></div>
                        <TextArea label="Relevant details (optional)" rows={3} value={x.details} onChange={(v) => updateEducation(x.id, { details: v })} placeholder="Relevant coursework, honors, activities..." />
                      </EntryCard>
                    ))}
                    <button type="button" className="add-card" onClick={() => edit('education', [...resume.education, { id: uid(), institution: '', degree: '', location: '', startYear: '', endYear: '', details: '' }])}>＋ Add education</button>
                  </div>
                )}

                {active === 'skills' && (
                  <div className="field-stack">
                    <div className="tip-card"><strong>Keep skills searchable</strong><p>Group technical skills by category using the format shown below. This creates clean, readable lines for applicant tracking systems.</p></div>
                    <TextArea label="Technical skills" value={resume.skills} onChange={(v) => edit('skills', v)} rows={11} placeholder={'Languages: Java, Python, SQL, JavaScript\nFrameworks: React, FastAPI\nDatabases: PostgreSQL, MySQL\nTools: Git, GitHub, Postman'} hint="Use one category per line. Plain comma-separated skills also work." />
                  </div>
                )}

                {active === 'certifications' && (
                  <div className="field-stack">
                    {resume.certifications.map((x, i) => (
                      <EntryCard key={x.id} title={`Certification ${i + 1}`} onRemove={() => edit('certifications', resume.certifications.filter((item) => item.id !== x.id))}>
                        <Field label="Certification name" value={x.name} onChange={(v) => updateCertification(x.id, { name: v })} placeholder="Certification title" />
                        <div className="two-fields"><Field label="Issuing organization" value={x.issuer} onChange={(v) => updateCertification(x.id, { issuer: v })} placeholder="Organization" /><Field label="Year" value={x.year} onChange={(v) => updateCertification(x.id, { year: v })} placeholder="2026" /></div>
                        <Field label="Credential link (optional)" value={x.link} onChange={(v) => updateCertification(x.id, { link: v })} placeholder="Credential URL" />
                      </EntryCard>
                    ))}
                    <button type="button" className="add-card" onClick={() => edit('certifications', [...resume.certifications, { id: uid(), name: '', issuer: '', year: '', link: '' }])}>＋ Add certification</button>
                  </div>
                )}

                {notice && <div role="status" className="notice">{notice}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
                <div className="editor-footer">
                  <button type="button" className="btn subtle" disabled={active === 'profile'} onClick={() => setActive(sections[Math.max(0, sections.findIndex((x) => x.id === active) - 1)].id)}>← Back</button>
                  <button type="button" className="btn primary" onClick={() => active === 'certifications' ? window.print() : setActive(sections[Math.min(sections.length - 1, sections.findIndex((x) => x.id === active) + 1)].id)}>{active === 'certifications' ? 'Export PDF ↗' : 'Next section →'}</button>
                </div>
              </div>
              <div className="editor-info">🔒 Your draft stays in this browser. Only descriptions you choose to improve are sent to the Gemini-powered backend. Save a JSON backup before clearing browser data.</div>
            </section>

            <section className="preview-column" aria-label="Resume preview">
              <div className="preview-toolbar">
                <div><strong>Live preview</strong><span>Single-column, ATS-friendly</span></div>
                <div className="template-switch" aria-label="Choose resume template"><button type="button" className={resume.template === 'modern' ? 'active' : ''} onClick={() => edit('template', 'modern')}>Modern</button><button type="button" className={resume.template === 'classic' ? 'active' : ''} onClick={() => edit('template', 'classic')}>Classic</button></div>
              </div>
              <div className="paper-wrapper"><ResumePreview resume={resume} /></div>
              <div className="quality-card"><div className="quality-head"><div><strong>Resume completeness</strong><p>A preparation checklist, not an ATS score</p></div><strong>{completion}%</strong></div><div className="progress-track"><div style={{ width: `${completion}%` }} /></div><div className="quality-chips"><span>{hasText(resume.name) ? '✓' : '○'} Name</span><span>{hasText(resume.email) ? '✓' : '○'} Email</span><span>{hasText(resume.summary) ? '✓' : '○'} Summary</span><span>{resume.projects.some((x) => hasText(x.name) && hasText(x.description)) || resume.experience.some((x) => hasText(x.title) && hasText(x.company)) ? '✓' : '○'} Work / projects</span><span>{resume.education.some((x) => hasText(x.institution) && hasText(x.degree)) ? '✓' : '○'} Education</span><span>{hasText(resume.skills) ? '✓' : '○'} Skills</span></div></div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
