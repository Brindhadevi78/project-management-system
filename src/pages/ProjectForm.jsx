import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'

export default function ProjectForm() {
  const { activeTeam } = useTeam()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ name: '', description: '', status: 'active' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit) {
      supabase.from('projects').select('*').eq('id', id).single()
        .then(({ data }) => { if (data) setForm({ name: data.name, description: data.description || '', status: data.status }) })
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (isEdit) {
      const { error } = await supabase.from('projects').update(form).eq('id', id)
      if (error) setError(error.message)
      else navigate('/projects')
    } else {
      const { error } = await supabase.from('projects').insert({ ...form, user_id: user.id, team_id: activeTeam?.id || null })
      if (error) setError(error.message)
      else navigate('/projects')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-8">{isEdit ? 'Edit Project' : 'New Project'}</h1>
      {error && <p className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">{error}</p>}
      <form onSubmit={handleSubmit} className="glass rounded-2xl shadow-xl shadow-slate-200/50 p-8 space-y-5 border border-white/50">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex gap-3 pt-6 mt-2 border-t border-slate-100">
          <button type="submit" disabled={loading} className="flex-1 bg-brand-600 font-semibold text-white py-3 rounded-xl hover:bg-brand-700 shadow-lg hover:shadow-brand-500/30 transition disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
          </button>
          <button type="button" onClick={() => navigate('/projects')} className="flex-1 border-2 border-slate-200 font-semibold text-slate-600 py-3 rounded-xl hover:bg-slate-50 transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
