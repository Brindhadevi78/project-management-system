import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'
import { Link } from 'react-router-dom'

export default function Projects() {
  const { user } = useAuth()
  const { activeTeam } = useTeam()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = async () => {
    setLoading(true)
    let query = supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (activeTeam) query = query.eq('team_id', activeTeam.id)
    else query = query.is('team_id', null).eq('user_id', user.id)

    const { data } = await query
    setProjects(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [activeTeam])

  const deleteProject = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return
    await supabase.from('tasks').delete().eq('project_id', id)
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return <p className="text-gray-500">Loading projects...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Projects</h1>
        <Link to="/projects/new" className="bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 transition hover:shadow-lg hover:shadow-brand-500/30 font-medium text-sm">
          + New Project
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-slate-400 border border-dashed border-slate-200">
          No projects found in this workspace. Create your first project!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className="glass rounded-2xl shadow-xl shadow-slate-200/50 p-6 flex flex-col gap-4 transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
              <div>
                <h2 className="text-lg font-bold text-slate-800 leading-tight">{project.name}</h2>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{project.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  project.status === 'active' ? 'bg-green-100 text-green-700' :
                  project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {project.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Link to={`/projects/${project.id}`} className="flex-1 text-center font-semibold border border-brand-500 text-brand-600 py-2 rounded-xl text-[13px] hover:bg-brand-50 transition">
                  View Tasks
                </Link>
                <Link to={`/projects/${project.id}/edit`} className="flex-1 text-center font-semibold border border-slate-300 text-slate-600 py-2 rounded-xl text-[13px] hover:bg-slate-50 transition">
                  Edit
                </Link>
                <button onClick={() => deleteProject(project.id)} className="font-semibold text-red-500 border border-red-300 px-4 py-2 rounded-xl text-[13px] hover:bg-red-50 hover:text-red-600 transition">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
