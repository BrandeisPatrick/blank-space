// Notion Replica - Block-based document editor
export const notion = {
  name: "Notion Replica",
  files: {
    "App.jsx": `import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import TopBar from "./components/TopBar";

export default function App() {
  const [pages, setPages] = useState([
    {
      id: "1",
      title: "Getting Started",
      icon: "📖",
      blocks: [
        { id: "b1", type: "heading", content: "Welcome to Notion Clone" },
        { id: "b2", type: "paragraph", content: "This is a simple block-based editor inspired by Notion. You can create different types of blocks and organize your content." },
        { id: "b3", type: "heading", content: "Features" },
        { id: "b4", type: "list", content: "Create and organize pages" },
        { id: "b5", type: "list", content: "Add different block types: headings, paragraphs, lists, and code" },
        { id: "b6", type: "list", content: "Drag and drop to reorder blocks" },
      ]
    },
    {
      id: "2",
      title: "My Tasks",
      icon: "✅",
      blocks: [
        { id: "t1", type: "heading", content: "Today's Tasks" },
        { id: "t2", type: "list", content: "Review project documentation" },
        { id: "t3", type: "list", content: "Update design mockups" },
        { id: "t4", type: "list", content: "Team meeting at 3 PM" },
      ]
    },
    {
      id: "3",
      title: "Code Snippets",
      icon: "💻",
      blocks: [
        { id: "c1", type: "heading", content: "Useful React Patterns" },
        { id: "c2", type: "code", content: "const [state, setState] = useState(initialValue);" },
        { id: "c3", type: "paragraph", content: "Use custom hooks to extract reusable logic." },
      ]
    }
  ]);

  const [currentPageId, setCurrentPageId] = useState("1");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentPage = pages.find(p => p.id === currentPageId);

  const addPage = () => {
    const newPage = {
      id: Date.now().toString(),
      title: "Untitled",
      icon: "📄",
      blocks: [
        { id: Date.now().toString() + "-b1", type: "heading", content: "Untitled" }
      ]
    };
    setPages([...pages, newPage]);
    setCurrentPageId(newPage.id);
  };

  const updatePageTitle = (pageId, newTitle) => {
    setPages(pages.map(p =>
      p.id === pageId ? { ...p, title: newTitle } : p
    ));
  };

  const updatePageIcon = (pageId, newIcon) => {
    setPages(pages.map(p =>
      p.id === pageId ? { ...p, icon: newIcon } : p
    ));
  };

  const deletePage = (pageId) => {
    const newPages = pages.filter(p => p.id !== pageId);
    setPages(newPages);
    if (currentPageId === pageId && newPages.length > 0) {
      setCurrentPageId(newPages[0].id);
    }
  };

  const updateBlocks = (pageId, newBlocks) => {
    setPages(pages.map(p =>
      p.id === pageId ? { ...p, blocks: newBlocks } : p
    ));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        currentPage={currentPage}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          pages={pages}
          currentPageId={currentPageId}
          onSelectPage={setCurrentPageId}
          onAddPage={addPage}
          onDeletePage={deletePage}
        />

        <main className="flex-1 overflow-y-auto">
          {currentPage ? (
            <Editor
              page={currentPage}
              onUpdateTitle={updatePageTitle}
              onUpdateIcon={updatePageIcon}
              onUpdateBlocks={updateBlocks}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-xl mb-4">No pages available</p>
                <button
                  onClick={addPage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create a Page
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}`,

    "components/TopBar.jsx": `export default function TopBar({ sidebarOpen, onToggleSidebar, currentPage }) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 space-x-4">
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <div className="flex items-center space-x-2">
        {currentPage && (
          <>
            <span className="text-xl">{currentPage.icon}</span>
            <span className="font-medium text-gray-900">{currentPage.title}</span>
          </>
        )}
      </div>
    </div>
  );
}`,

    "components/Sidebar.jsx": `export default function Sidebar({ isOpen, pages, currentPageId, onSelectPage, onAddPage, onDeletePage }) {
  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            N
          </div>
          <span className="font-semibold text-gray-900">My Workspace</span>
        </div>

        <button
          onClick={onAddPage}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          + New Page
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-xs font-semibold text-gray-500 px-2 mb-2">PAGES</div>
        <div className="space-y-1">
          {pages.map(page => (
            <div
              key={page.id}
              className={\`
                group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition
                \${currentPageId === page.id ? "bg-gray-200" : "hover:bg-gray-100"}
              \`}
              onClick={() => onSelectPage(page.id)}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="text-lg">{page.icon}</span>
                <span className="text-sm text-gray-900 truncate">{page.title}</span>
              </div>

              {pages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePage(page.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Notion Clone v1.0
        </div>
      </div>
    </aside>
  );
}`,

    "components/Editor.jsx": `import { useState } from "react";
import Block from "./Block";

export default function Editor({ page, onUpdateTitle, onUpdateIcon, onUpdateBlocks }) {
  const [editingTitle, setEditingTitle] = useState(false);

  const addBlock = (type = "paragraph") => {
    const newBlock = {
      id: Date.now().toString(),
      type,
      content: ""
    };
    onUpdateBlocks(page.id, [...page.blocks, newBlock]);
  };

  const updateBlock = (blockId, updates) => {
    onUpdateBlocks(
      page.id,
      page.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
    );
  };

  const deleteBlock = (blockId) => {
    if (page.blocks.length > 1) {
      onUpdateBlocks(page.id, page.blocks.filter(b => b.id !== blockId));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => {
              const newIcon = prompt("Enter an emoji:", page.icon);
              if (newIcon) onUpdateIcon(page.id, newIcon);
            }}
            className="text-6xl hover:bg-gray-100 rounded-lg p-2 transition"
          >
            {page.icon}
          </button>
        </div>

        {editingTitle ? (
          <input
            type="text"
            value={page.title}
            onChange={(e) => onUpdateTitle(page.id, e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
            autoFocus
            className="text-5xl font-bold w-full bg-transparent border-none outline-none text-gray-900"
          />
        ) : (
          <h1
            onClick={() => setEditingTitle(true)}
            className="text-5xl font-bold text-gray-900 cursor-text hover:bg-gray-50 px-2 -mx-2 rounded"
          >
            {page.title}
          </h1>
        )}
      </div>

      {/* Blocks */}
      <div className="space-y-2">
        {page.blocks.map((block, index) => (
          <Block
            key={block.id}
            block={block}
            onUpdate={updateBlock}
            onDelete={deleteBlock}
            isLast={index === page.blocks.length - 1}
          />
        ))}
      </div>

      {/* Add Block Menu */}
      <div className="mt-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => addBlock("paragraph")}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            + Add a block
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => addBlock("heading")}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Heading
          </button>
          <button
            onClick={() => addBlock("list")}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            List
          </button>
          <button
            onClick={() => addBlock("code")}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Code
          </button>
        </div>
      </div>
    </div>
  );
}`,

    "components/Block.jsx": `import { useState } from "react";

export default function Block({ block, onUpdate, onDelete, isLast }) {
  const [isHovered, setIsHovered] = useState(false);

  const getClassName = () => {
    const base = "w-full bg-transparent border-none outline-none resize-none";
    switch (block.type) {
      case "heading":
        return \`\${base} text-3xl font-bold text-gray-900\`;
      case "code":
        return \`\${base} font-mono text-sm bg-gray-100 p-3 rounded-lg text-gray-800\`;
      case "list":
        return \`\${base} text-gray-700 pl-6\`;
      default:
        return \`\${base} text-gray-700\`;
    }
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case "heading":
        return "Heading";
      case "code":
        return "Code snippet...";
      case "list":
        return "List item";
      default:
        return "Type something...";
    }
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Block Controls */}
      {isHovered && (
        <div className="absolute -left-8 top-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onDelete(block.id)}
            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Block Content */}
      <div className="relative">
        {block.type === "list" && (
          <span className="absolute left-0 top-1 text-gray-400">•</span>
        )}

        <textarea
          value={block.content}
          onChange={(e) => {
            onUpdate(block.id, { content: e.target.value });
            // Auto-resize textarea
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          placeholder={getPlaceholder()}
          className={getClassName()}
          rows={1}
          style={{ minHeight: "32px" }}
        />
      </div>
    </div>
  );
}`
  }
};
