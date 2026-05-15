import { Plus, Upload as UploadIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { sql } from '@codemirror/lang-sql'
import { cpp } from '@codemirror/lang-cpp'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { groupsApi, notesApi } from '../api/client.js'

export default function EditNote() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [groups, setGroups] = useState([])
  const [error, setError] = useState('')
  const [images, setImages] = useState([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    topic: 'DSA',
    type: 'Note',
    difficulty: 'Medium',
    content: '',
    repo: '',
    visibility: 'private',
    groupIds: [],
  })

  useEffect(() => {
    groupsApi.list().then((data) => setGroups(data.groups)).catch(() => setGroups([]))
    if (id) {
      notesApi.get(id).then((data) => {
        const { note } = data;
        setForm({
          title: note.title || '',
          description: note.description || '',
          topic: note.topic || 'DSA',
          type: note.type || 'Note',
          difficulty: note.difficulty || 'Medium',
          content: note.content || '',
          repo: note.repo || '',
          visibility: note.visibility || 'private',
          groupIds: note.groupIds || [],
        })
        setTags(note.tags || [])
        setImages(note.images || [])
      }).catch((err) => setError('Failed to load note: ' + err.message))
    }
  }, [id])

  const addTag = () => {
    const clean = tagInput.trim()
    if (clean && !tags.includes(clean)) setTags([...tags, clean])
    setTagInput('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      await notesApi.update(id, { ...form, tags, images })
      navigate(`/note/${id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImages((current) => [...current, { name: file.name, dataUrl: reader.result }])
    reader.readAsDataURL(file)
  }

  return (
    <div className="page">
      <PageTitle title="Edit Note" subtitle="Update your note details and content" />
      <div className="form-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <Field label="Title *"><input className="input" value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Dynamic Programming - Complete Guide" /></Field>
          <Field label="Description *"><textarea className="input" value={form.description} onChange={(event) => updateField('description', event.target.value)} rows="3" placeholder="A short summary of what this note covers..." /></Field>
          <div className="two-col">
            <Field label="Topic *"><select className="input" value={form.topic} onChange={(event) => updateField('topic', event.target.value)}><option>DSA</option><option>SQL</option><option>ML</option><option>NLP</option><option>Projects</option><option>Concepts</option></select></Field>
            <Field label="Type *"><select className="input" value={form.type} onChange={(event) => updateField('type', event.target.value)}><option>Note</option><option>Question Set</option><option>Concept</option><option>Project</option><option>Code Explanation</option></select></Field>
          </div>
          <div className="two-col">
            <Field label="Difficulty"><select className="input" value={form.difficulty} onChange={(event) => updateField('difficulty', event.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></Field>
            <Field label="Visibility"><select className="input" value={form.visibility} onChange={(event) => updateField('visibility', event.target.value)}><option value="private">Private</option><option value="group">Group</option><option value="public">Public</option></select></Field>
          </div>
          <Field label="Group"><select className="input" value={form.groupIds[0] || ''} onChange={(event) => updateField('groupIds', event.target.value ? [event.target.value] : [])}><option value="">No group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></Field>
          <Field label="Tags">
            <div className="tag-input">
              {tags.map((tag) => <span key={tag}>{tag}<X size={12} onClick={() => setTags(tags.filter((item) => item !== tag))} /></span>)}
              <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addTag())} placeholder="Add tag..." />
            </div>
          </Field>
          <Field label="Content (Markdown, SQL, and code supported) *">
            <CodeMirror
              value={form.content}
              height="350px"
              theme={vscodeDark}
              extensions={[javascript({ jsx: true }), python(), sql(), cpp()]}
              onChange={(val) => updateField('content', val)}
              style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', fontSize: '14px' }}
            />
          </Field>
          <Field label="GitHub Repository (optional)"><input className="input" value={form.repo} onChange={(event) => updateField('repo', event.target.value)} placeholder="https://github.com/username/repo" /></Field>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => navigate(`/note/${id}`)}>Cancel</button><button className="btn btn-primary"><UploadIcon size={16} /> Save Changes</button></div>
        </form>
        <aside className="side-stack">
          <section className="card"><h3>Guidelines</h3><ul className="check-list"><li>Use clear titles</li><li>Add relevant tags</li><li>Include code examples</li><li>Link your GitHub repo</li></ul></section>
          <section className="card"><h3>Images</h3><label className="dropzone"><Plus size={30} /><p>Add diagrams or screenshots</p><small>PNG or JPG stored with the note</small><input type="file" accept="image/*" hidden onChange={handleImage} /></label>{images.map((image) => <img className="image-preview" key={image.name} src={image.dataUrl} alt={image.name} />)}</section>
        </aside>
      </div>
    </div>
  )
}

export function PageTitle({ title, subtitle }) {
  return <header className="page-header"><h1>{title}</h1><p>{subtitle}</p></header>
}

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>
}
