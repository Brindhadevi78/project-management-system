import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/projects', label: 'Projects', icon: '📁' },
  { to: '/teams', label: 'Teams', icon: '👥' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const { teams, activeTeam, setActiveTeam } = useTeam()
  const avatarLetter = (user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col min-h-screen relative z-10 shadow-2xl">
      <div className="p-4 border-b border-slate-800/60 bg-slate-900/50">
        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2 block px-1 mt-1">Current Workspace</label>
        <div className="relative group">
          <select 
            value={activeTeam?.id || ''} 
            onChange={(e) => {
              const team = teams.find(t => t.id === e.target.value)
              setActiveTeam(team || null)
            }}
            className="w-full appearance-none bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer shadow-inner hover:bg-slate-700 transition"
          >
            <option value="">👤 Personal Workspace</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>👥 {t.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
            ▼
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center gap-3 bg-slate-800/20">
        <div className="w-9 h-9 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner border border-slate-600">
          {avatarLetter}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{user?.user_metadata?.full_name || 'User'}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25 translate-x-1' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 hover:translate-x-1'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/60">
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-300"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
