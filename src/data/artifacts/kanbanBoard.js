/**
 * Kanban Board
 * Drag and drop task management with Framer Motion - Modern responsive design
 */

export const kanbanBoardArtifact = {
  id: 'kanban-board',
  name: 'Kanban Board',
  description: 'A project management board with draggable task cards, priority tags, and progress tracking. Built with native HTML5 drag and drop API, Framer Motion layout animations, and horizontal scroll for mobile devices.',
  icon: 'layout',
  category: 'demos',
  files: {
    'App.jsx': `
const initialTasks = {
  todo: [
    { id: '1', title: 'Research competitors', priority: 'high', tags: ['research'] },
    { id: '2', title: 'Design mockups', priority: 'medium', tags: ['design'] },
    { id: '3', title: 'Write documentation', priority: 'low', tags: ['docs'] },
  ],
  inProgress: [
    { id: '4', title: 'Build dashboard', priority: 'high', tags: ['dev'] },
    { id: '5', title: 'API integration', priority: 'medium', tags: ['dev', 'backend'] },
  ],
  review: [
    { id: '6', title: 'Code review PR #42', priority: 'high', tags: ['review'] },
  ],
  done: [
    { id: '7', title: 'Setup project', priority: 'low', tags: ['setup'] },
    { id: '8', title: 'Create repo', priority: 'low', tags: ['setup'] },
  ],
};

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-500' },
  { id: 'inProgress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', title: 'Review', color: 'bg-amber-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

const priorityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

function TaskCard({ task, onDragStart, isDragging }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0, scale: isDragging ? 1.05 : 1 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      className="bg-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-xl p-3 sm:p-4 cursor-grab active:cursor-grabbing shadow-lg shadow-black/10 transition-shadow hover:shadow-xl"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-white font-medium text-xs sm:text-sm">{task.title}</h3>
        <span className={\`text-xs px-1.5 sm:px-2 py-0.5 rounded-full border whitespace-nowrap \${priorityColors[task.priority]}\`}>
          {task.priority}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {task.tags.map((tag) => (
          <span key={tag} className="text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-600/50 text-slate-300">
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function Column({ column, tasks, onDrop, onDragOver, draggedTask }) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      className={\`flex-shrink-0 w-64 sm:w-72 md:flex-1 md:min-w-[220px] \${isOver ? 'ring-2 ring-indigo-500/50 rounded-2xl' : ''}\`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
        onDragOver(e, column.id);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        setIsOver(false);
        onDrop(e, column.id);
      }}
    >
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className={\`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full \${column.color}\`}></div>
        <h2 className="text-white font-semibold text-sm sm:text-base">{column.title}</h2>
        <span className="text-slate-500 text-xs sm:text-sm ml-auto">{tasks.length}</span>
      </div>
      <div className="space-y-2 sm:space-y-3 min-h-[150px] sm:min-h-[200px] p-2 rounded-xl bg-slate-800/30 backdrop-blur border border-slate-700/30">
        <AnimatePresence>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDragStart={(e) => onDragOver(e, task)}
              isDragging={draggedTask?.id === task.id}
            />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="h-20 sm:h-24 flex items-center justify-center text-slate-500 text-xs sm:text-sm border-2 border-dashed border-slate-700 rounded-xl">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [draggedTask, setDraggedTask] = useState(null);
  const [sourceColumn, setSourceColumn] = useState(null);

  const handleDragStart = (e, task, columnId) => {
    setDraggedTask(task);
    setSourceColumn(columnId);
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    if (!draggedTask || !sourceColumn || sourceColumn === targetColumn) {
      setDraggedTask(null);
      setSourceColumn(null);
      return;
    }

    setTasks((prev) => {
      const newTasks = { ...prev };
      // Remove from source
      newTasks[sourceColumn] = prev[sourceColumn].filter((t) => t.id !== draggedTask.id);
      // Add to target
      newTasks[targetColumn] = [...prev[targetColumn], draggedTask];
      return newTasks;
    });

    setDraggedTask(null);
    setSourceColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
  };

  const totalTasks = Object.values(tasks).flat().length;
  const doneTasks = tasks.done.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Project Board</h1>
            <p className="text-slate-400 text-xs sm:text-sm">Drag tasks between columns</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-bold text-white">{doneTasks}/{totalTasks}</p>
              <p className="text-slate-400 text-xs">Tasks completed</p>
            </div>
            <div className="w-20 sm:w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: \`\${(doneTasks / totalTasks) * 100}%\` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Board - Horizontal scroll on mobile */}
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={tasks[column.id]}
              draggedTask={draggedTask}
              onDrop={handleDrop}
              onDragOver={(e, task) => {
                if (task?.id) {
                  handleDragStart(e, task, column.id);
                } else {
                  handleDragOver(e, column.id);
                }
              }}
            />
          ))}
        </div>

        <p className="text-center text-slate-500 text-xs mt-4 sm:mt-6">
          Drag and drop powered by native HTML5 + Framer Motion
        </p>
      </motion.div>
    </div>
  );
}

export default App;
`
  }
};
