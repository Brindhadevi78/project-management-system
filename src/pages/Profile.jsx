import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ projects: 0, tasks: 0, done: 0 })

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || '')
    const fetchStats = async () => {
      const { data: projects } = await supabase.from('projects').select('id').eq('user_id', user.id)
      const { data: tasks } = await supabase.from('tasks').select('status').eq('user_id', user.id)
      setStats({
        projects: projects?.length || 0,
        tasks: tasks?.length || 0,
        done: tasks?.filter(t => t.status === 'done').length || 0,
      })
    }
    fetchStats()
  }, [user])

  const updateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg({})
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
    if (error) setMsg({ type: 'error', text: error.message })
    else setMsg({ type: 'success', text: 'Profile updated successfully!' })
    setLoading(false)
  }

  const updatePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setLoading(true)
    setMsg({})
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setMsg({ type: 'error', text: error.message })
    else { setMsg({ type: 'success', text: 'Password updated successfully!' }); setNewPassword(''); setConfirmPassword('') }
    setLoading(false)
  }

  const avatarLetter = (fullName || user?.email || 'U')[0].toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Profile</h1>

      {msg.text && (
        <div className={`p-3 rounded-lg text-sm border ${msg.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Avatar + Info */}
      <div className="bg-white rounded-xl shadow p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {avatarLetter}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800">{fullName || 'No name set'}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="text-xs text-gray-400 mt-1">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Projects', value: stats.projects, color: 'text-indigo-600' },
          { label: 'Total Tasks', value: stats.tasks, color: 'text-blue-600' },
          { label: 'Completed', value: stats.done, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Update Name */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Update Profile</h2>
        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={user?.email}
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Change Password</h2>
        <form onSubmit={updatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              minLength={6}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              minLength={6}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button type="submit" disabled={loading} className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-900 transition text-sm disabled:opacity-50">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
