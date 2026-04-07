import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'
import { Link } from 'react-router-dom'

const DEMO_PROJECTS = [
  {
    name: 'Website Redesign',
    description: 'Redesign the company website with modern UI/UX',
    status: 'active',
    tasks: [
      { title: 'Create wireframes', status: 'done', priority: 'high', assignee: 'Alice' },
      { title: 'Design homepage mockup', status: 'done', priority: 'high', assignee: 'Alice' },
      { title: 'Build responsive layout', status: 'in_progress', priority: 'high', assignee: 'Bob' },
      { title: 'Integrate CMS', status: 'todo', priority: 'medium', assignee: 'Bob' },
      { title: 'SEO optimization', status: 'todo', priority: 'low', assignee: 'Carol' },
    ],
  },
  {
    name: 'Mobile App MVP',
    description: 'Build the first version of the mobile application',
    status: 'active',
    tasks: [
      { title: 'Setup React Native project', status: 'done', priority: 'high', assignee: 'Dave' },
      { title: 'Auth screens', status: 'done', priority: 'high', assignee: 'Dave' },
      { title: 'Dashboard screen', status: 'in_progress', priority: 'medium', assignee: 'Eve' },
      { title: 'Push notifications', status: 'todo', priority: 'medium', assignee: 'Eve' },
      { title: 'App store submission', status: 'todo', priority: 'low', assignee: 'Dave' },
    ],
  },
  {
    name: 'Marketing Campaign Q3',
    description: 'Plan and execute Q3 marketing campaigns',
    status: 'completed',
    tasks: [
      { title: 'Define target audience', status: 'done', priority: 'high', assignee: 'Frank' },
      { title: 'Create ad creatives', status: 'done', priority: 'high', assignee: 'Grace' },
      { title: 'Launch social media ads', status: 'done', priority: 'medium', assignee: 'Frank' },
      { title: 'Analyze campaign results', status: 'done', priority: 'medium', assignee: 'Grace' },
    ],
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { activeTeam } = useTeam()
  const [stats, setStats] = useState({ projects: 0, tasks: 0, done: 0, inProgress: 0 })
  const [recentTasks, setRecentTasks] = useState([])
  const [seeding, setSeeding] = useState(false)
  const [hasData, setHasData] = useState(true)

  const fetchStats = async () => {
    let pQuery = supabase.from('projects').select('id')
    if (activeTeam) pQuery = pQuery.eq('team_id', activeTeam.id)
    else pQuery = pQuery.is('team_id', null).eq('user_id', user.id)
    
    const { data: projects } = await pQuery
    const projectIds = projects?.map(p => p.id) || []
    
    let tasks = []
    let allTasks = []
    
    if (projectIds.length > 0) {
      const { data: t } = await supabase.from('tasks')
        .select('id, title, status, priority, created_at')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(5)
      tasks = t || []
      
      const { data: at } = await supabase.from('tasks')
        .select('status')
        .in('project_id', projectIds)
      allTasks = at || []
    }

    setHasData(projectIds.length > 0)
    setStats({
      projects: projectIds.length,
      tasks: allTasks.length,
      done: allTasks.filter(t => t.status === 'done').length,
      inProgress: allTasks.filter(t => t.status === 'in_progress').length,
    })
    setRecentTasks(tasks)
  }

  useEffect(() => { fetchStats() }, [user, activeTeam])

  const seedDemoData = async () => {
    setSeeding(true)
    for (const proj of DEMO_PROJECTS) {
      const { data: project } = await supabase
        .from('projects')
        .insert({ name: proj.name, description: proj.description, status: proj.status, user_id: user.id, team_id: activeTeam?.id || null })
        .select()
        .single()
      if (project) {
        const tasks = proj.tasks.map(t => ({ ...t, project_id: project.id, user_id: user.id }))
        await supabase.from('tasks').insert(tasks)
      }
    }
    await fetchStats()
    setSeeding(false)
  }

  const cards = [
    { label: 'Total Projects', value: stats.projects, color: 'bg-gradient-to-br from-brand-500 to-purple-600', icon: '📁', shadow: 'shadow-brand-500/30' },
    { label: 'Total Tasks', value: stats.tasks, color: 'bg-gradient-to-br from-blue-500 to-cyan-500', icon: '📋', shadow: 'shadow-blue-500/30' },
    { label: 'In Progress', value: stats.inProgress, color: 'bg-gradient-to-br from-amber-500 to-orange-500', icon: '⚡', shadow: 'shadow-amber-500/30' },
    { label: 'Completed', value: stats.done, color: 'bg-gradient-to-br from-emerald-500 to-teal-500', icon: '✅', shadow: 'shadow-emerald-500/30' },
  ]

  const statusBadge = (status) => {
    const map = { todo: 'bg-gray-100 text-gray-600', in_progress: 'bg-yellow-100 text-yellow-700', done: 'bg-green-100 text-green-700' }
    const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status]}`}>{labels[status]}</span>
  }

  const priorityBadge = (priority) => {
    const map = { low: 'text-gray-400', medium: 'text-yellow-500', high: 'text-red-500' }
    return <span className={`text-xs font-medium ${map[priority]}`}>● {priority}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]} 👋</p>
        </div>
        <Link to="/projects/new" className="bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-300 text-sm font-medium transform hover:-translate-y-0.5">
          + New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className={`${card.color} text-white rounded-2xl p-6 shadow-xl ${card.shadow} transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300`}>
            <div className="flex justify-between items-start">
              <p className="text-3xl font-bold">{card.value}</p>
              <span className="text-2xl opacity-80">{card.icon}</span>
            </div>
            <p className="text-sm mt-1 opacity-90">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Demo Data Banner */}
      {!hasData && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex justify-between items-center">
          <div>
            <p className="font-semibold text-indigo-700">🚀 Get started with demo data</p>
            <p className="text-sm text-indigo-500 mt-0.5">Load 3 sample projects with tasks to explore the app.</p>
          </div>
          <button
            onClick={seedDemoData}
            disabled={seeding}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50 whitespace-nowrap"
          >
            {seeding ? 'Loading...' : 'Load Demo Data'}
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="glass rounded-2xl shadow-xl shadow-slate-200/50 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-slate-800 text-lg">Recent Tasks</h2>
            <Link to="/projects" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline transition">View all →</Link>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No tasks yet. Create a project to get started.</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 rounded-lg -mx-2 px-2 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
                    <div className="flex gap-2 mt-1">{priorityBadge(task.priority)}</div>
                  </div>
                  <div className="ml-3">{statusBadge(task.status)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass rounded-2xl shadow-xl shadow-slate-200/50 p-6">
          <h2 className="font-semibold text-slate-800 text-lg mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/projects/new', icon: '📁', label: 'Create New Project', desc: 'Start a new project' },
              { to: '/projects', icon: '📋', label: 'View All Projects', desc: 'Browse your projects' },
              { to: '/profile', icon: '👤', label: 'Edit Profile', desc: 'Update your info' },
              { to: '/settings', icon: '⚙️', label: 'Settings', desc: 'Manage preferences' },
            ].map(item => (
              <Link key={item.to} to={item.to} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {stats.tasks > 0 && (
        <div className="glass rounded-2xl shadow-xl shadow-slate-200/50 p-6 mb-6">
          <h2 className="font-semibold text-slate-800 text-lg mb-4">Overall Progress</h2>
          <div className="space-y-3">
            {[
              { label: 'Completed', value: stats.done, color: 'bg-green-500' },
              { label: 'In Progress', value: stats.inProgress, color: 'bg-yellow-400' },
              { label: 'To Do', value: stats.tasks - stats.done - stats.inProgress, color: 'bg-gray-200' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: `${stats.tasks ? (item.value / stats.tasks) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
