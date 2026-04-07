const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600 border border-slate-200',
  medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  high: 'bg-red-100 text-red-600 border border-red-200',
}

export default function TaskCard({ task, onDelete, onEdit, onStatusChange, columns }) {
  return (
    <div className="glass rounded-xl shadow-md p-5 space-y-3 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 cursor-grab active:cursor-grabbing border-white/60">
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-semibold text-slate-800 text-[15px] leading-snug">{task.title}</h3>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low}`}>
          {task.priority}
        </span>
      </div>
      {task.description && <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{task.description}</p>}
      <div className="flex flex-wrap items-center gap-3 mt-2">
        {task.assignee && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <span className="text-sm">👤</span> {task.assignee}
          </div>
        )}
        {task.due_date && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <span className="text-sm">📅</span> {new Date(task.due_date).toLocaleDateString()}
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-3 mt-1 border-t border-slate-100 flex-wrap">
        {columns.filter(c => c.key !== task.status).map(col => (
          <button
            key={col.key}
            onClick={() => onStatusChange(task.id, col.key)}
            className="text-[11px] font-semibold tracking-wide border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 hover:border-slate-300 text-slate-500 transition-colors shadow-sm"
          >
            → {col.label}
          </button>
        ))}
        <div className="flex gap-2 ml-auto">
          <button onClick={() => onEdit(task)} className="text-[11px] font-semibold tracking-wide text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-md hover:bg-brand-100 transition-colors shadow-sm">
            Edit
          </button>
          <button onClick={() => onDelete(task.id)} className="text-[11px] font-semibold tracking-wide text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md hover:bg-red-100 transition-colors shadow-sm">
            Del
          </button>
        </div>
      </div>
    </div>
  )
}
