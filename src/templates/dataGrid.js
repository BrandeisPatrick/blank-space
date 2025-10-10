// Data Grid example - Complex performance test with 1000 rows
export const dataGrid = {
  name: 'Data Grid (1000 rows)',
  files: {
    'App.jsx': `import DataGridTable from './components/DataGridTable';
import FilterInput from './components/FilterInput';
import { useDataGrid } from './hooks/useDataGrid';
import { useRowSelection } from './hooks/useRowSelection';

export default function App() {
  const { data, filteredAndSorted, filterText, setFilterText, sortColumn, sortDirection, handleSort } = useDataGrid();
  const { selectedRows, toggleRowSelection } = useRowSelection();

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Data Grid Performance Test</h1>
      <FilterInput
        filterText={filterText}
        onFilterChange={setFilterText}
        totalRows={data.length}
        filteredRows={filteredAndSorted.length}
        selectedCount={selectedRows.size}
      />
      <DataGridTable
        data={filteredAndSorted}
        selectedRows={selectedRows}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onToggleSelection={toggleRowSelection}
      />
    </div>
  );
}`,
    'components/FilterInput.jsx': `export default function FilterInput({ filterText, onFilterChange, totalRows, filteredRows, selectedCount }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <input
        type="text"
        placeholder="Filter by name, email, or department..."
        value={filterText}
        onChange={(e) => onFilterChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '14px',
          border: '2px solid #e5e7eb',
          borderRadius: '6px'
        }}
      />
      <div style={{ marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
        Showing {filteredRows} of {totalRows} rows | {selectedCount} selected
      </div>
    </div>
  );
}`,
    'components/DataGridTable.jsx': `import DataGridHeader from './DataGridHeader';
import DataGridRow from './DataGridRow';

export default function DataGridTable({ data, selectedRows, sortColumn, sortDirection, onSort, onToggleSelection }) {
  const columns = ['id', 'name', 'email', 'age', 'salary', 'department', 'status'];

  return (
    <div style={{ overflow: 'auto', maxHeight: '600px', border: '1px solid #e5e7eb' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <DataGridHeader
          columns={columns}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <tbody>
          {data.map(row => (
            <DataGridRow
              key={row.id}
              row={row}
              isSelected={selectedRows.has(row.id)}
              onToggleSelection={onToggleSelection}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}`,
    'components/DataGridHeader.jsx': `export default function DataGridHeader({ columns, sortColumn, sortDirection, onSort }) {
  return (
    <thead style={{ position: 'sticky', top: 0, background: '#f9fafb' }}>
      <tr>
        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
          <input type="checkbox" />
        </th>
        {columns.map(col => (
          <th
            key={col}
            onClick={() => onSort(col)}
            style={{
              padding: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              borderBottom: '2px solid #e5e7eb',
              background: sortColumn === col ? '#e0e7ff' : '#f9fafb'
            }}
          >
            {col.charAt(0).toUpperCase() + col.slice(1)}
            {sortColumn === col && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
          </th>
        ))}
      </tr>
    </thead>
  );
}`,
    'components/DataGridRow.jsx': `export default function DataGridRow({ row, isSelected, onToggleSelection }) {
  return (
    <tr
      style={{
        background: isSelected ? '#eff6ff' : 'white',
        borderBottom: '1px solid #e5e7eb'
      }}
    >
      <td style={{ padding: '12px' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(row.id)}
        />
      </td>
      <td style={{ padding: '12px' }}>{row.id}</td>
      <td style={{ padding: '12px' }}>{row.name}</td>
      <td style={{ padding: '12px' }}>{row.email}</td>
      <td style={{ padding: '12px' }}>{row.age}</td>
      <td style={{ padding: '12px' }}>\${row.salary.toLocaleString()}</td>
      <td style={{ padding: '12px' }}>{row.department}</td>
      <td style={{ padding: '12px' }}>
        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          background: row.status === 'Active' ? '#d1fae5' : '#fee2e2',
          color: row.status === 'Active' ? '#065f46' : '#991b1b',
          fontSize: '12px'
        }}>
          {row.status}
        </span>
      </td>
    </tr>
  );
}`,
    'hooks/useDataGrid.js': `import { useState, useMemo } from 'react';

export function useDataGrid() {
  const [sortColumn, setSortColumn] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterText, setFilterText] = useState('');

  // Generate 1000 rows of data
  const data = useMemo(() => {
    return Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: \`User \${i + 1}\`,
      email: \`user\${i + 1}@example.com\`,
      age: Math.floor(Math.random() * 50) + 20,
      salary: Math.floor(Math.random() * 100000) + 30000,
      department: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'][Math.floor(Math.random() * 5)],
      status: Math.random() > 0.5 ? 'Active' : 'Inactive'
    }));
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = data.filter(row =>
      row.name.toLowerCase().includes(filterText.toLowerCase()) ||
      row.email.toLowerCase().includes(filterText.toLowerCase()) ||
      row.department.toLowerCase().includes(filterText.toLowerCase())
    );

    result.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const modifier = sortDirection === 'asc' ? 1 : -1;
      return aVal > bVal ? modifier : aVal < bVal ? -modifier : 0;
    });

    return result;
  }, [data, sortColumn, sortDirection, filterText]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return {
    data,
    filteredAndSorted,
    filterText,
    setFilterText,
    sortColumn,
    sortDirection,
    handleSort
  };
}`,
    'hooks/useRowSelection.js': `import { useState } from 'react';

export function useRowSelection() {
  const [selectedRows, setSelectedRows] = useState(new Set());

  const toggleRowSelection = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  return {
    selectedRows,
    toggleRowSelection
  };
}`,
    'styles.css': `body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}`
  }
};
