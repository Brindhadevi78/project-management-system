import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState('')

  const handleDeleteAllData = async () => {
    if (confirmDelete !== 'DELETE') {
      setMsg({ type: 'error', text: 'Type DELETE to confirm.' })
      return
    }
    setDeleting(true)
    await supabase.from('tasks').delete().eq('user_id', user.id)
    await supabase.from('projects').delete().eq('user_id', user.id)
    setMsg({ type: 'success', text: 'All your projects and tasks have been deleted.' })
    setConfirmDelete('')
    setDeleting(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      {msg.text && (
        <div className={`p-3 rounded-lg text-sm border ${msg.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-700">Account</h2>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Email</span>
          <span className="text-sm text-gray-800 font-medium">{user?.email}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Account ID</span>
          <span className="text-xs text-gray-400 font-mono">{user?.id?.slice(0, 16)}...</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-600">Joined</span>
          <span className="text-sm text-gray-800">{new Date(user?.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Notifications (UI only) */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-700">Preferences</h2>
        {[
          { label: 'Email notifications', desc: 'Receive updates about your projects' },
          { label: 'Task reminders', desc: 'Get reminded about due dates' },
          { label: 'Weekly summary', desc: 'Weekly digest of your activity' },
        ].map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={i === 0} className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-checked:bg-indigo-600 rounded-full transition peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>
        ))}
      </div>

      {/* Sign Out */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Session</h2>
        <button onClick={handleSignOut} className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-50 transition text-sm">
          🚪 Sign Out
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow p-6 border border-red-100">
        <h2 className="text-base font-semibold text-red-600 mb-3">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-3">This will permanently delete all your projects and tasks. Type <strong>DELETE</strong> to confirm.</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={confirmDelete}
            onChange={e => setConfirmDelete(e.target.value)}
            placeholder="Type DELETE"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 w-40"
          />
          <button
            onClick={handleDeleteAllData}
            disabled={deleting}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete All Data'}
          </button>
        </div>
      </div>
    </div>
  )
}
