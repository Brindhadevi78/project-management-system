import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'

export default function Teams() {
  const { user } = useAuth()
  const { teams, fetchTeams } = useTeam()
  const [newTeamName, setNewTeamName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: dbError } = await supabase
      .from('teams')
      .insert({ name: newTeamName, owner_id: user.id })
    
    if (dbError) setError(dbError.message)
    else {
      setNewTeamName('')
      fetchTeams()
      setSuccess('Team created successfully!')
      setTimeout(() => setSuccess(''), 3000)
    }
    setLoading(false)
  }

  const loadTeamMembers = async (teamId) => {
    const { data } = await supabase
      .from('team_members')
      .select('*, profiles(email, full_name)')
      .eq('team_id', teamId)
    setMembers(data || [])
  }

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id)
    }
  }, [selectedTeam])

  const handleInvite = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // 1. Look up user by email in profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail)
      .single()

    if (profileError || !profileData) {
      setError('User not found. They must sign up first.')
      setLoading(false)
      return
    }

    // 2. Insert into team_members
    const { error: inviteError } = await supabase
      .from('team_members')
      .insert({
        team_id: selectedTeam.id,
        user_id: profileData.id,
        role: 'member'
      })

    if (inviteError) {
      setError(inviteError.message)
    } else {
      setSuccess('User added successfully!')
      setInviteEmail('')
      loadTeamMembers(selectedTeam.id)
      setTimeout(() => setSuccess(''), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8 relative">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-brand-600 tracking-tight">Teams & Workspaces</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Collaborate with others on shared projects in isolated environments.</p>
        </div>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-xl text-sm font-medium shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${error ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
          <span className="text-lg">{error ? '⚠️' : '✅'}</span>
          {error || success}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: List Teams & Create Team */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-white/60 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-all duration-500"></div>
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="text-brand-500">🏢</span> Your Teams
            </h2>
            {teams.length === 0 ? (
              <div className="bg-slate-50/80 rounded-2xl p-5 text-center border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">You are not part of any teams yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full text-left px-5 py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-between group/btn ${
                      selectedTeam?.id === team.id
                        ? 'bg-gradient-to-r from-brand-500 flexitems to-brand-600 text-white shadow-lg shadow-brand-500/30 font-semibold transform scale-[1.02]'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-brand-300'
                    }`}
                  >
                    <span className="truncate">{team.name}</span>
                    {team.owner_id === user.id && (
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                        selectedTeam?.id === team.id ? 'bg-white/20 border-white/30 text-white' : 'bg-amber-100 border-amber-200 text-amber-700 group-hover/btn:bg-amber-200'
                      }`}>Owner</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-white/60">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-purple-500">✨</span> Create New Team
            </h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Acme Corp..."
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  required
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 text-sm font-medium transition-all"
                />
              </div>
              <button
                disabled={loading}
                className="w-full bg-slate-800 text-white py-3 rounded-2xl font-bold text-sm tracking-wide hover:bg-slate-900 shadow-lg shadow-slate-800/20 transition-all duration-300 disabled:opacity-50"
              >
                Launch Team Workspace
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Manage Selected Team */}
        <div className="lg:col-span-8">
          {selectedTeam ? (
            <div className="glass rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-white/60 h-full flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-wrap justify-between items-end mb-8 border-b border-slate-200/60 pb-6 relative z-10">
                <div>
                  <div className="inline-flex items-center justify-center p-2 bg-gradient-to-br from-brand-100 to-purple-100 rounded-xl mb-3 text-brand-600 shadow-sm border border-brand-200/50">
                    👥
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{selectedTeam.name}</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Workspace Hub • Manage members and assign roles.</p>
                </div>
              </div>

              {selectedTeam.owner_id === user.id && (
                <div className="mb-10 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 relative z-10">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Launch Invites</h3>
                  <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-slate-400">📧</span>
                      </div>
                      <input
                        type="email"
                        placeholder="Type member's registered email..."
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 text-sm font-medium shadow-sm transition-all"
                      />
                    </div>
                    <button
                      disabled={loading}
                      className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-300 disabled:opacity-50 whitespace-nowrap"
                    >
                      Send Invite
                    </button>
                  </form>
                </div>
              )}

              <div className="relative z-10 flex-1">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span>Current Members</span>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">{members.length + 1} users</span>
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Owner Card */}
                  <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 shadow-sm rounded-2xl transform hover:-translate-y-1 transition-all duration-300 hover:shadow-md hover:border-brand-300">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                      👑
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">Workspace Owner</p>
                      <p className="text-xs font-medium text-slate-500 truncate">Admin Privileges</p>
                    </div>
                  </div>

                  {/* Members Cards */}
                  {members.map(member => (
                    <div key={member.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 shadow-sm rounded-2xl transform hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg shadow-inner">
                        {(member.profiles?.full_name || member.profiles?.email || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{member.profiles?.full_name || 'Team Member'}</p>
                        <p className="text-xs font-medium text-slate-500 truncate">{member.profiles?.email}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-slate-200">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-3xl flex flex-col items-center justify-center h-full min-h-[500px] border-dashed border-2 border-slate-300/60 bg-slate-50/30 text-center p-8">
              <div className="w-24 h-24 mb-6 rounded-full bg-brand-100 flex items-center justify-center animate-bounce shadow-inner shadow-brand-200 border border-white">
                 <span className="text-4xl">🪄</span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Select a Workspace</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">Choose a team from the left sidebar to view its members, invite collaborators, and manage settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
