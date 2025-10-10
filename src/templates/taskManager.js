// Task Manager - Organize and track your tasks
export const taskManager = {
  name: "Task Manager",
  files: {
    "App.jsx": `import { useState, useEffect } from "react";
import Header from "./components/Header";
import TaskList from "./components/TaskList";
import AddTaskForm from "./components/AddTaskForm";
import Filters from "./components/Filters";
import Stats from "./components/Stats";

export default function App() {
  const [tasks, setTasks] = useState([
    {
      id: "1",
      title: "Build landing page",
      description: "Create responsive landing page with React and Tailwind",
      category: "Work",
      priority: "high",
      dueDate: "2024-02-15",
      completed: false,
      createdAt: Date.now() - 86400000
    },
    {
      id: "2",
      title: "Write blog post",
      description: "Article about React hooks best practices",
      category: "Personal",
      priority: "medium",
      dueDate: "2024-02-20",
      completed: false,
      createdAt: Date.now() - 172800000
    },
    {
      id: "3",
      title: "Review pull requests",
      description: "Review team's PRs and provide feedback",
      category: "Work",
      priority: "high",
      dueDate: "2024-02-10",
      completed: true,
      createdAt: Date.now() - 259200000
    }
  ]);

  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [searchQuery, setSearchQuery] = useState("");

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (newTask) => {
    const task = {
      ...newTask,
      id: Date.now().toString(),
      completed: false,
      createdAt: Date.now()
    };
    setTasks([task, ...tasks]);
  };

  const updateTask = (taskId, updates) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const toggleComplete = (taskId) => {
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && !task.completed) ||
      (filter === "completed" && task.completed) ||
      task.priority === filter ||
      task.category === filter;

    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "dueDate") {
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === "createdAt") {
      return b.createdAt - a.createdAt;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header searchQuery={searchQuery} onSearch={setSearchQuery} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Stats tasks={tasks} />
            <div className="mt-6">
              <Filters
                currentFilter={filter}
                onFilterChange={setFilter}
                currentSort={sortBy}
                onSortChange={setSortBy}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AddTaskForm onAddTask={addTask} />

            <div className="mt-6">
              <TaskList
                tasks={sortedTasks}
                onToggleComplete={toggleComplete}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,

    "components/Header.jsx": `export default function Header({ searchQuery, onSearch }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Task Manager
            </h1>
            <p className="text-gray-600 mt-1">Stay organized and productive</p>
          </div>

          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>
    </header>
  );
}`,

    "components/Stats.jsx": `export default function Stats({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Total Tasks</span>
            <span className="text-2xl font-bold text-gray-900">{total}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Active</span>
            <span className="text-2xl font-bold text-blue-600">{active}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Completed</span>
            <span className="text-2xl font-bold text-green-600">{completed}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Completion Rate</span>
            <span className="text-sm font-semibold text-gray-900">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: \`\${completionRate}%\` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}`,

    "components/Filters.jsx": `export default function Filters({ currentFilter, onFilterChange, currentSort, onSortChange }) {
  const filters = [
    { id: "all", label: "All Tasks" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
    { id: "high", label: "High Priority" },
    { id: "medium", label: "Medium Priority" },
    { id: "low", label: "Low Priority" }
  ];

  const sortOptions = [
    { id: "dueDate", label: "Due Date" },
    { id: "priority", label: "Priority" },
    { id: "createdAt", label: "Created" }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Filters</h2>

      <div className="space-y-2 mb-6">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={\`
              w-full text-left px-4 py-2 rounded-lg transition
              \${currentFilter === filter.id
                ? "bg-blue-600 text-white"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }
            \`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-3">Sort By</h3>
      <div className="space-y-2">
        {sortOptions.map(option => (
          <button
            key={option.id}
            onClick={() => onSortChange(option.id)}
            className={\`
              w-full text-left px-4 py-2 rounded-lg transition
              \${currentSort === option.id
                ? "bg-purple-600 text-white"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }
            \`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}`,

    "components/AddTaskForm.jsx": `import { useState } from "react";

export default function AddTaskForm({ onAddTask }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Personal",
    priority: "medium",
    dueDate: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onAddTask(formData);
      setFormData({
        title: "",
        description: "",
        category: "Personal",
        priority: "medium",
        dueDate: ""
      });
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
      >
        + Add New Task
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Task</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What needs to be done?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add more details..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Personal</option>
              <option>Work</option>
              <option>Study</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Add Task
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}`,

    "components/TaskList.jsx": `import TaskItem from "./TaskItem";

export default function TaskList({ tasks, onToggleComplete, onUpdateTask, onDeleteTask }) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-xl text-gray-500">No tasks found</p>
        <p className="text-gray-400 mt-2">Add a new task to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
        />
      ))}
    </div>
  );
}`,

    "components/TaskItem.jsx": `export default function TaskItem({ task, onToggleComplete, onUpdate, onDelete }) {
  const priorityColors = {
    high: "border-l-red-500 bg-red-50",
    medium: "border-l-yellow-500 bg-yellow-50",
    low: "border-l-green-500 bg-green-50"
  };

  const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <div className={\`
      bg-white rounded-xl shadow-sm p-5 border-l-4 \${priorityColors[task.priority]}
      \${task.completed ? "opacity-60" : ""}
      hover:shadow-md transition-shadow
    \`}>
      <div className="flex items-start space-x-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleComplete(task.id)}
          className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <h3 className={\`
            text-lg font-semibold text-gray-900
            \${task.completed ? "line-through" : ""}
          \`}>
            {task.title}
          </h3>

          {task.description && (
            <p className="text-gray-600 mt-1 text-sm">
              {task.description}
            </p>
          )}

          <div className="flex items-center space-x-4 mt-3">
            <span className={\`
              px-2 py-1 rounded-full text-xs font-medium
              \${task.priority === "high" ? "bg-red-100 text-red-700" : ""}
              \${task.priority === "medium" ? "bg-yellow-100 text-yellow-700" : ""}
              \${task.priority === "low" ? "bg-green-100 text-green-700" : ""}
            \`}>
              {task.priority}
            </span>

            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {task.category}
            </span>

            {task.dueDate && (
              <span className={\`text-xs \${isOverdue ? "text-red-600 font-semibold" : "text-gray-500"}\`}>
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}`
  }
};
