/**
 * Calendar + Todo App Artifact
 * A simple, responsive calendar and task management application.
 */

export const calendarTodoArtifact = {
  id: 'calendar',
  name: 'Calendar',
  description: 'A simple calendar and task manager.',
  icon: 'productivity',
  category: 'apps',
  files: {
    'App.jsx': `
/* ========================================================================
   HOOKS
   ======================================================================== */

const useTodos = (initialTodos = []) => {
  const [todos, setTodos] = useState(initialTodos);
  const [filter, setFilter] = useState('all');

  const addTodo = (text, dueDate = null) => {
    if (!text.trim()) return;
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      dueDate
    };
    setTodos([newTodo, ...todos]);
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const filteredTodos = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return todos.filter(todo => {
          if (!todo.dueDate) return false;
          const todoDate = new Date(todo.dueDate);
          return todoDate.getFullYear() === now.getFullYear() &&
                 todoDate.getMonth() === now.getMonth() &&
                 todoDate.getDate() === now.getDate();
        });
      case 'upcoming':
        return todos.filter(todo => todo.dueDate && new Date(todo.dueDate) > now);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  return { todos, filteredTodos, addTodo, toggleTodo, deleteTodo, filter, setFilter };
};

const useCalendar = (todos) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();

  const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);
  const leadingEmptyDays = Array.from({ length: startDay }, () => null);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const eventsByDay = useMemo(() => {
    const events = {};
    todos.forEach(todo => {
      if (todo.dueDate) {
        const date = new Date(todo.dueDate);
        if (date.getFullYear() === currentDate.getFullYear() && date.getMonth() === currentDate.getMonth()) {
          const day = date.getDate();
          if (!events[day]) {
            events[day] = [];
          }
          events[day].push(todo);
        }
      }
    });
    return events;
  }, [todos, currentDate]);

  return { currentDate, daysInMonth, leadingEmptyDays, nextMonth, prevMonth, eventsByDay };
};


/* ========================================================================
   COMPONENTS
   ======================================================================== */

const Calendar = ({ todos }) => {
  const { currentDate, daysInMonth, leadingEmptyDays, nextMonth, prevMonth, eventsByDay } = useCalendar(todos);
  const today = new Date();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 sm:p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{monthName} <span className="text-gray-400 font-light">{year}</span></h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 dark:text-gray-500 mb-2">
        {weekdays.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {leadingEmptyDays.map((_, index) => <div key={'empty-' + index}></div>)}
        {daysInMonth.map(day => {
          const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
          const hasEvents = eventsByDay[day] && eventsByDay[day].length > 0;

          return (
            <div key={day} className={\`relative flex items-center justify-center h-8 text-sm rounded-lg \${isToday ? 'bg-blue-500 text-white font-bold' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'} transition-colors\`}>
              {day}
              {hasEvents && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TodoItem = ({ todo, onToggle, onDelete }) => {
  const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
  const isOverdue = dueDate && !todo.completed && dueDate < new Date();

  return (
    <div className="flex items-center p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors group">
      <div className="flex items-center flex-grow">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500/50 dark:bg-gray-800 dark:border-gray-600"
        />
        <div className="ml-3 flex-grow">
          <p className={\`text-sm \${todo.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'} transition-colors\`}>{todo.text}</p>
          {dueDate && (
            <p className={\`text-xs \${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400 dark:text-gray-500'}\`}>
              {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>
      </div>
      <button onClick={() => onDelete(todo.id)} className="p-2 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-500 transition-opacity">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </div>
  );
};

const TodoList = ({ todos, onToggle, onDelete, filter, onFilterChange }) => {
  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 sm:p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Tasks</h2>
      <div className="flex items-center gap-2 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
        {['all', 'today', 'upcoming', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={\`px-2 py-1 text-xs rounded-full capitalize transition-colors \${filter === f ? 'bg-blue-500 text-white font-semibold' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}\`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-2 flex-grow overflow-y-auto pr-1">
        {todos.length > 0
          ? todos.map(todo => <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />)
          : <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <p>No tasks in this category.</p>
            </div>
        }
      </div>
    </div>
  );
};

/* ========================================================================
   APP
   ======================================================================== */

function App() {
  const { todos, filteredTodos, addTodo, toggleTodo, deleteTodo, filter, setFilter } = useTodos([
    { id: 1, text: 'Design the new dashboard', completed: false, dueDate: new Date().toISOString().split('T')[0] },
    { id: 2, text: 'Develop the calendar component', completed: false, dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { id: 3, text: 'Review pull requests', completed: true, dueDate: '2025-11-30' },
  ]);

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-3 sm:p-4 font-sans">
      <style>{'body { font-family: "Inter", sans-serif; }'}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      <div className="max-w-7xl mx-auto">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Calendar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your tasks and schedule</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <Calendar todos={todos} />
          </div>
          <div className="lg:col-span-2">
            <TodoList todos={filteredTodos} onToggle={toggleTodo} onDelete={deleteTodo} filter={filter} onFilterChange={setFilter} />
          </div>
        </main>
      </div>
    </div>
  );
}
`,
    'styles.css': `
      /* Using Tailwind CSS primarily, this file is for minor tweaks */
      body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `,
  },
};
