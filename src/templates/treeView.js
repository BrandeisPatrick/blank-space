// Tree View example - Performance test with 10,000 nodes
export const treeView = {
  name: 'Tree View (10,000 nodes)',
  files: {
    'App.jsx': `import TreeNode from './components/TreeNode';
import TreeControls from './components/TreeControls';
import { useTreeData } from './hooks/useTreeData';
import { useTreeExpansion } from './hooks/useTreeExpansion';
import { useTreeSearch } from './hooks/useTreeSearch';

export default function App() {
  const { tree, totalNodes } = useTreeData(5, 10);
  const { expandedNodes, handleToggle, handleExpandAll, expandAll } = useTreeExpansion(tree);
  const { searchTerm, setSearchTerm } = useTreeSearch();

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Tree View Performance Test</h1>

      <TreeControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        expandAll={expandAll}
        onExpandAll={handleExpandAll}
        totalNodes={totalNodes}
        expandedCount={expandedNodes.size}
      />

      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'auto',
        maxHeight: '600px',
        background: 'white'
      }}>
        {tree.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            expandedNodes={expandedNodes}
            onToggle={handleToggle}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </div>
  );
}`,
    'components/TreeNode.jsx': `export default function TreeNode({ node, level, expandedNodes, onToggle, searchTerm }) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const matches = !searchTerm || node.name.toLowerCase().includes(searchTerm.toLowerCase());

  if (!matches) return null;

  return (
    <div>
      <div
        onClick={() => hasChildren && onToggle(node.id)}
        style={{
          paddingLeft: \`\${level * 20}px\`,
          padding: '8px',
          cursor: hasChildren ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: level % 2 === 0 ? '#f9fafb' : 'white',
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        {hasChildren && (
          <span style={{
            display: 'inline-block',
            width: '16px',
            transition: 'transform 0.2s'
          }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span style={{ width: '16px' }}></span>}
        <span style={{
          fontWeight: hasChildren ? '600' : '400',
          color: hasChildren ? '#111827' : '#6b7280'
        }}>
          {node.name}
        </span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}`,
    'components/TreeControls.jsx': `function TreeControls({ searchTerm, onSearchChange, expandAll, onExpandAll, totalNodes, expandedCount }) {
  return (
    <div style={{
      marginBottom: '20px',
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      padding: '16px',
      background: '#f9fafb',
      borderRadius: '8px'
    }}>
      <input
        type="text"
        placeholder="Search nodes..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          flex: 1,
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px'
        }}
      />
      <button
        onClick={onExpandAll}
        style={{
          padding: '8px 16px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        {expandAll ? 'Collapse All' : 'Expand All'}
      </button>
      <div style={{ color: '#6b7280', fontSize: '14px' }}>
        {expandedCount} / {totalNodes} nodes expanded
      </div>
    </div>
  );
}`,
    'hooks/useTreeData.js': `function useTreeData(depth, childrenPerNode) {
  const [tree, setTree] = React.useState([]);
  const [totalNodes, setTotalNodes] = React.useState(0);

  React.useEffect(() => {
    let nodeId = 0;
    let count = 0;

    const createNode = (level) => {
      count++;
      const node = {
        id: nodeId++,
        name: \`Node \${nodeId}\`,
        children: []
      };

      if (level < depth) {
        for (let i = 0; i < childrenPerNode; i++) {
          node.children.push(createNode(level + 1));
        }
      }

      return node;
    };

    const newTree = [];
    for (let i = 0; i < childrenPerNode; i++) {
      newTree.push(createNode(0));
    }

    setTree(newTree);
    setTotalNodes(count);
  }, [depth, childrenPerNode]);

  return { tree, totalNodes };
}`,
    'hooks/useTreeExpansion.js': `function useTreeExpansion(tree) {
  const [expandedNodes, setExpandedNodes] = React.useState(new Set());
  const [expandAll, setExpandAll] = React.useState(false);

  const handleToggle = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedNodes(new Set());
    } else {
      const allIds = new Set();
      const collectIds = (nodes) => {
        nodes.forEach(node => {
          if (node.children && node.children.length > 0) {
            allIds.add(node.id);
            collectIds(node.children);
          }
        });
      };
      collectIds(tree);
      setExpandedNodes(allIds);
    }
    setExpandAll(!expandAll);
  };

  return { expandedNodes, handleToggle, handleExpandAll, expandAll };
}`,
    'hooks/useTreeSearch.js': `function useTreeSearch() {
  const [searchTerm, setSearchTerm] = React.useState('');
  return { searchTerm, setSearchTerm };
}`
  }
};
