import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTeam } from '../context/TeamContext'
import { useAuth } from '../context/AuthContext'

const defaultForm = { title: '', description: '', status: 'todo', priority: 'medium', assignee: '', due_date: '' }

export default function TaskModal({ projectId, task, onClose, onSaved }) {
  const { user } = useAuth()
  const { activeTeam } = useTeam()
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('details') // 'details' | 'comments'
  
  // Team members & comments data
  const [members, setMembers] = useState([])
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignee: task.assignee || '',
        due_date: task.due_date || '',
      })
      fetchComments()
    }
  }, [task])

  useEffect(() => {
    const fetchMembers = async () => {
      if (!activeTeam) return
      const { data } = await supabase
        .from('team_members')
        .select('*, profiles(email, full_name)')
        .eq('team_id', activeTeam.id)
      setMembers(data || [])
    }
    fetchMembers()
  }, [activeTeam])

  const fetchComments = async () => {
    if (!task) return
    const { data } = await supabase
      .from('task_comments')
      .select('*, profiles(full_name, email)')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
    // If you haven't joined profiles strictly, we might just show an ID, 
    // but the schema says we can try to join if we set up profiles safely. 
    // For now we'll do best-effort rendering.
    setComments(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (task) {
      const { error } = await supabase.from('tasks').update(form).eq('id', task.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('tasks').insert({ ...form, project_id: projectId, user_id: user.id })
      if (error) { setError(error.message); setLoading(false); return }
    }
    setLoading(false)
    onSaved()
    onClose()
  }

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setLoading(true)
    const { error } = await supabase.from('task_comments').insert({
      task_id: task.id,
      user_id: user.id,
      content: newComment.trim()
    })
    
    if (error) setError(error.message)
    else {
      setNewComment('')
      fetchComments()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl shadow-2xl w-full max-w-lg border border-white/50 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-200 bg-white/50 px-2 pt-2">
          <button 
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {task ? 'Edit Task' : 'New Task'}
          </button>
          {task && (
            <button 
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'comments' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Comments ({comments.length})
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-4 text-slate-400 hover:text-slate-600 text-xl font-medium">✕</button>
        </div>

        <div className="overflow-y-auto p-6">
          {error && <p className="bg-red-50 text-red-500 font-medium p-3 border border-red-100 rounded-xl mb-4 text-sm">{error}</p>}
          
          {activeTab === 'details' ? (
            <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 appearance-none">
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 appearance-none">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assignee</label>
                  {activeTeam ? (
                    <select
                      value={form.assignee}
                      onChange={e => setForm({ ...form, assignee: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 appearance-none"
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => {
                        const name = m.profiles?.full_name || m.profiles?.email || m.user_id
                        return <option key={m.user_id} value={name}>{name}</option>
                      })}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.assignee}
                      onChange={e => setForm({ ...form, assignee: e.target.value })}
                      placeholder="You"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="space-y-3 mb-6">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No comments yet.</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-700 text-xs">
                           User
                        </span>
                        <span className="text-[10px] text-slate-400">{new Date(comment.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-600">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <button 
                  disabled={loading || !newComment.trim()} 
                  className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

        {activeTab === 'details' && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex gap-3">
            <button form="task-form" type="submit" disabled={loading} className="flex-1 bg-brand-600 font-semibold text-white py-2.5 rounded-xl hover:bg-brand-700 shadow-lg hover:shadow-brand-500/30 transition disabled:opacity-50 text-sm">
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border-2 border-slate-200 font-semibold text-slate-600 py-2.5 rounded-xl hover:bg-slate-100 transition text-sm">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
