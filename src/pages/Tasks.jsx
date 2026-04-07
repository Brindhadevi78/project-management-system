import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-slate-100/60 border border-slate-200/60' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-amber-50/60 border border-amber-200/50' },
  { key: 'done', label: 'Done', color: 'bg-emerald-50/60 border border-emerald-200/50' },
]

export default function Tasks() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)

  const fetchData = async () => {
    const [{ data: proj }, { data: taskData }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
    ])
    setProject(proj)
    setTasks(taskData || [])
  }

  useEffect(() => { fetchData() }, [projectId])

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const updateStatus = async (id, status) => {
    await supabase.from('tasks').update({ status }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  const openEdit = (task) => { setEditTask(task); setShowModal(true) }
  const openNew = () => { setEditTask(null); setShowModal(true) }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link to="/projects" className="text-sm font-medium text-brand-500 hover:text-brand-600 hover:underline transition">← Back to Projects</Link>
          <h1 className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">{project?.name || 'Loading...'}</h1>
          {project?.description && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{project.description}</p>}
        </div>
        <button onClick={openNew} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-300 text-sm font-medium transform hover:-translate-y-0.5">
          + Add Task
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {COLUMNS.map(col => (
          <div key={col.key} className={`${col.color} rounded-2xl p-5 shadow-sm`}>
            <h2 className="font-bold text-slate-700 mb-4 flex items-center">
              {col.label}
              <span className="ml-2 text-xs font-semibold bg-white px-2.5 py-1 rounded-full text-slate-500 shadow-sm">
                {tasks.filter(t => t.status === col.key).length}
              </span>
            </h2>
            <div className="space-y-3">
              {tasks.filter(t => t.status === col.key).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={deleteTask}
                  onEdit={openEdit}
                  onStatusChange={updateStatus}
                  columns={COLUMNS}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <TaskModal
          projectId={projectId}
          task={editTask}
          onClose={() => setShowModal(false)}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}
