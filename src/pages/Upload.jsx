import { Plus, Upload as UploadIcon, X } from 'lucide-react'
import { useState } from 'react'

export default function Upload() {
  const [tags, setTags] = useState(['DP', 'Algorithms'])
  const [tagInput, setTagInput] = useState('')
  const addTag = () => {
    const clean = tagInput.trim()
    if (clean && !tags.includes(clean)) setTags([...tags, clean])
    setTagInput('')
  }

  return (
    <div className="page">
      <PageTitle title="Upload Content" subtitle="Share your notes, concepts, or questions with the community" />
      <div className="form-grid">
        <form className="card form-card">
          <Field label="Title *"><input className="input" placeholder="Dynamic Programming - Complete Guide" /></Field>
          <Field label="Description *"><textarea className="input" rows="3" placeholder="A short summary of what this note covers..." /></Field>
          <div className="two-col">
            <Field label="Topic *"><select className="input"><option>Data Structures</option><option>Algorithms</option><option>SQL</option><option>System Design</option></select></Field>
            <Field label="Type *"><select className="input"><option>Note</option><option>Question Set</option><option>Concept</option></select></Field>
          </div>
          <Field label="Tags">
            <div className="tag-input">
              {tags.map((tag) => <span key={tag}>{tag}<X size={12} onClick={() => setTags(tags.filter((item) => item !== tag))} /></span>)}
              <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addTag())} placeholder="Add tag..." />
            </div>
          </Field>
          <Field label="Content (Markdown supported) *"><textarea className="input mono" rows="14" placeholder="# Heading&#10;&#10;Write your note in markdown..." /></Field>
          <Field label="GitHub Repository (optional)"><input className="input" placeholder="https://github.com/username/repo" /></Field>
          <div className="form-actions"><button className="btn btn-secondary">Save as Draft</button><button className="btn btn-primary"><UploadIcon size={16} /> Publish Note</button></div>
        </form>
        <aside className="side-stack">
          <section className="card"><h3>Guidelines</h3><ul className="check-list"><li>Use clear titles</li><li>Add relevant tags</li><li>Include code examples</li><li>Link your GitHub repo</li></ul></section>
          <section className="card"><h3>Cover Image</h3><div className="dropzone"><Plus size={30} /><p>Drag and drop or click to upload</p><small>PNG or JPG up to 2MB</small></div></section>
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
