type TreeNode = {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNode[];
};

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: "", path: "", isFile: false, children: [] };

  for (const filePath of paths) {
    const parts = filePath.split("/");
    let node = root;
    let accPath = "";
    parts.forEach((part, i) => {
      accPath = accPath ? `${accPath}/${part}` : part;
      const isFile = i === parts.length - 1;
      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, path: accPath, isFile, children: [] };
        node.children.push(child);
      }
      node = child;
    });
  }

  return root;
}

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path
      d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
      strokeLinejoin="round"
    />
    <path d="M14 2v4h4" strokeLinejoin="round" />
  </svg>
);

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path
      d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z"
      strokeLinejoin="round"
    />
  </svg>
);

function TreeNodeView({
  node,
  depth,
  activeFile,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activeFile: string;
  onSelect: (path: string) => void;
}) {
  return (
    <>
      {node.children.map((child) => (
        <div key={child.path}>
          <button
            className={`ft-node ${!child.isFile ? "ft-folder" : ""} ${
              child.isFile && child.path === activeFile ? "active" : ""
            }`}
            style={{ paddingLeft: 12 + depth * 14 }}
            onClick={() => child.isFile && onSelect(child.path)}
          >
            <span className="ft-icon">{child.isFile ? <FileIcon /> : <FolderIcon />}</span>
            {child.name}
          </button>
          {!child.isFile && (
            <TreeNodeView
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              onSelect={onSelect}
            />
          )}
        </div>
      ))}
    </>
  );
}

export default function FileTree({
  paths,
  activeFile,
  onSelect,
}: {
  paths: string[];
  activeFile: string;
  onSelect: (path: string) => void;
}) {
  const tree = buildTree(paths);
  return (
    <nav className="ft-tree">
      <TreeNodeView node={tree} depth={0} activeFile={activeFile} onSelect={onSelect} />
    </nav>
  );
}
