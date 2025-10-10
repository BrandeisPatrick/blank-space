// Kanban Board example - Drag & Drop performance test
export const kanban = {
  name: 'Kanban Board (Drag & Drop)',
  files: {
    'App.jsx': `import KanbanBoard from './components/KanbanBoard';
import KanbanStats from './components/KanbanStats';
import { useKanbanColumns } from './hooks/useKanbanColumns';

export default function App() {
  const { columns, totalTasks, handleDragStart, handleDragOver, handleDrop } = useKanbanColumns();

  return (
    <div style={{ padding: '20px', background: '#f9fafb', minHeight: '100vh' }}>
      <h1>Kanban Board - Drag & Drop Performance Test</h1>
      <KanbanStats columns={columns} totalTasks={totalTasks} />
      <KanbanBoard
        columns={columns}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
    </div>
  );
}`,
    'components/KanbanBoard.jsx': `import KanbanColumn from './KanbanColumn';

export default function KanbanBoard({ columns, onDragStart, onDragOver, onDrop }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '20px'
    }}>
      {Object.entries(columns).map(([columnId, column]) => (
        <KanbanColumn
          key={columnId}
          columnId={columnId}
          column={column}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
}`,
    'components/KanbanColumn.jsx': `import KanbanCard from './KanbanCard';

export default function KanbanColumn({ columnId, column, onDragStart, onDragOver, onDrop }) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, columnId)}
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        minHeight: '500px',
        border: '2px solid #e5e7eb'
      }}
    >
      <h2 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: '#111827'
      }}>
        {column.title}
        <span style={{
          marginLeft: '8px',
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: 'normal'
        }}>
          ({column.items.length})
        </span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {column.items.map(item => (
          <KanbanCard
            key={item.id}
            item={item}
            columnId={columnId}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}`,
    'components/KanbanCard.jsx': `import { useDragAndDrop } from '../hooks/useDragAndDrop';

export default function KanbanCard({ item, columnId, onDragStart }) {
  const { handleMouseEnter, handleMouseLeave } = useDragAndDrop();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item, columnId)}
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        cursor: 'grab',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{
        fontWeight: '600',
        marginBottom: '8px',
        color: '#111827'
      }}>
        {item.title}
      </div>
      <div style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '8px'
      }}>
        {item.description}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px'
      }}>
        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          background: getPriorityColor(item.priority) + '20',
          color: getPriorityColor(item.priority),
          fontWeight: '600'
        }}>
          {item.priority}
        </span>
        <span style={{ color: '#6b7280' }}>
          {item.assignee}
        </span>
      </div>
    </div>
  );
}`,
    'components/KanbanStats.jsx': `export default function KanbanStats({ columns, totalTasks }) {
  return (
    <div style={{ marginBottom: '20px', color: '#6b7280' }}>
      Total Tasks: {totalTasks} |
      To Do: {columns.todo.items.length} |
      In Progress: {columns.inProgress.items.length} |
      Review: {columns.review.items.length} |
      Done: {columns.done.items.length}
    </div>
  );
}`,
    'hooks/useKanbanColumns.js': `import { useState, useMemo } from 'react';

export function useKanbanColumns() {
  const [columns, setColumns] = useState({
    todo: {
      title: 'To Do',
      items: Array.from({ length: 20 }, (_, i) => ({
        id: \`todo-\${i}\`,
        title: \`Task \${i + 1}\`,
        description: \`This is task description for task \${i + 1}\`,
        priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        assignee: \`User \${Math.floor(Math.random() * 5) + 1}\`
      }))
    },
    inProgress: {
      title: 'In Progress',
      items: Array.from({ length: 15 }, (_, i) => ({
        id: \`progress-\${i}\`,
        title: \`Task \${i + 21}\`,
        description: \`Working on task \${i + 21}\`,
        priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        assignee: \`User \${Math.floor(Math.random() * 5) + 1}\`
      }))
    },
    review: {
      title: 'Review',
      items: Array.from({ length: 10 }, (_, i) => ({
        id: \`review-\${i}\`,
        title: \`Task \${i + 36}\`,
        description: \`Reviewing task \${i + 36}\`,
        priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        assignee: \`User \${Math.floor(Math.random() * 5) + 1}\`
      }))
    },
    done: {
      title: 'Done',
      items: Array.from({ length: 25 }, (_, i) => ({
        id: \`done-\${i}\`,
        title: \`Task \${i + 46}\`,
        description: \`Completed task \${i + 46}\`,
        priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        assignee: \`User \${Math.floor(Math.random() * 5) + 1}\`
      }))
    }
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);

  const totalTasks = useMemo(() =>
    Object.values(columns).reduce((sum, col) => sum + col.items.length, 0),
    [columns]
  );

  const handleDragStart = (e, item, columnId) => {
    setDraggedItem(item);
    setDraggedFrom(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();

    if (!draggedItem || draggedFrom === targetColumnId) return;

    setColumns(prev => {
      const newColumns = { ...prev };

      // Remove from source
      newColumns[draggedFrom] = {
        ...newColumns[draggedFrom],
        items: newColumns[draggedFrom].items.filter(item => item.id !== draggedItem.id)
      };

      // Add to target
      newColumns[targetColumnId] = {
        ...newColumns[targetColumnId],
        items: [...newColumns[targetColumnId].items, draggedItem]
      };

      return newColumns;
    });

    setDraggedItem(null);
    setDraggedFrom(null);
  };

  return {
    columns,
    totalTasks,
    handleDragStart,
    handleDragOver,
    handleDrop
  };
}`,
    'hooks/useDragAndDrop.js': `export function useDragAndDrop() {
  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return {
    handleMouseEnter,
    handleMouseLeave
  };
}`,
    'styles.css': `body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}`
  }
};
