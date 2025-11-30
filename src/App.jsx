import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import './App.css'
import 'highlight.js/styles/github-dark.css'

function App() {
  const [markdownContent, setMarkdownContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [filePath, setFilePath] = useState('')
  const [fileList, setFileList] = useState([])
  const [allFiles, setAllFiles] = useState([])
  const [fileTree, setFileTree] = useState(null)
  const [expandedFolders, setExpandedFolders] = useState(new Set())

  // Build file tree structure from flat file list
  const buildFileTree = (files) => {
    const root = { name: '', children: {}, files: [], isFolder: true }

    files.forEach(file => {
      const path = file.webkitRelativePath || file.name
      const parts = path.split('/')
      let current = root

      // Navigate/create folder structure
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            children: {},
            files: [],
            isFolder: true
          }
        }
        current = current.children[part]
      }

      // Add file to current folder
      current.files.push({
        name: parts[parts.length - 1],
        path: path,
        file: file,
        isFolder: false
      })
    })

    return root
  }

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath)
      } else {
        newSet.add(folderPath)
      }
      return newSet
    })
  }

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)
    const mdFiles = files.filter(file => file.name.endsWith('.md'))

    if (mdFiles.length > 0) {
      setFileList(mdFiles)
      setAllFiles([])
      setFileTree(null)
      // Load the first file by default
      loadFile(mdFiles[0])
    }
  }

  const handleFolderSelect = async (event) => {
    const files = Array.from(event.target.files)

    if (files.length > 0) {
      // Sort files by path for better organization
      const sortedFiles = files.sort((a, b) => {
        const pathA = a.webkitRelativePath || a.name
        const pathB = b.webkitRelativePath || b.name
        return pathA.localeCompare(pathB)
      })

      setAllFiles(sortedFiles)

      // Build tree structure
      const tree = buildFileTree(sortedFiles)
      setFileTree(tree)

      // Expand all folders by default
      const allFolders = new Set()
      const collectFolders = (node) => {
        Object.values(node.children).forEach(child => {
          allFolders.add(child.path)
          collectFolders(child)
        })
      }
      collectFolders(tree)
      setExpandedFolders(allFolders)

      // Find markdown files and load the first one
      const mdFiles = sortedFiles.filter(file =>
        file.name.endsWith('.md') || file.name.endsWith('.markdown')
      )

      setFileList(mdFiles)

      if (mdFiles.length > 0) {
        loadFile(mdFiles[0])
      }
    }
  }

  const loadFile = async (file) => {
    const text = await file.text()
    setMarkdownContent(text)
    setFileName(file.name)
    setFilePath(file.webkitRelativePath || file.name)
  }

  const isMarkdownFile = (filename) => {
    return filename.endsWith('.md') || filename.endsWith('.markdown')
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    const mdFiles = files.filter(file => file.name.endsWith('.md'))

    if (mdFiles.length > 0) {
      setFileList(mdFiles)
      loadFile(mdFiles[0])
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  // Recursive component to render file tree
  const FileTreeNode = ({ node, depth = 0, isLast = false }) => {
    if (!node) return null

    const folders = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name))
    const files = node.files.sort((a, b) => a.name.localeCompare(b.name))

    return (
      <>
        {folders.map((folder, index) => {
          const isExpanded = expandedFolders.has(folder.path)
          const isFolderLast = index === folders.length - 1 && files.length === 0
          return (
            <div key={folder.path} className="tree-node">
              <li
                className="folder-item"
                data-depth={depth}
                style={{ paddingLeft: `${depth * 1.5}rem` }}
                onClick={() => toggleFolder(folder.path)}
              >
                <span className="tree-indent">
                  {depth > 0 && (
                    <>
                      <span className="tree-line"></span>
                      <span className="tree-corner"></span>
                    </>
                  )}
                </span>
                <span className="folder-icon">
                  {isExpanded ? '📂' : '📁'}
                </span>
                <span className="folder-name">{folder.name}</span>
                <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
              </li>
              {isExpanded && (
                <div className="tree-children">
                  <FileTreeNode node={folder} depth={depth + 1} isLast={isFolderLast} />
                </div>
              )}
            </div>
          )
        })}
        {files.map((fileItem, index) => {
          const isMd = isMarkdownFile(fileItem.name)
          const isActive = fileItem.path === filePath
          const isFileLast = index === files.length - 1
          return (
            <div key={fileItem.path} className="tree-node">
              <li
                className={`file-item ${isActive ? 'active' : ''} ${!isMd ? 'disabled' : ''}`}
                data-depth={depth}
                style={{ paddingLeft: `${depth * 1.5}rem` }}
                onClick={() => isMd && loadFile(fileItem.file)}
                title={fileItem.path}
              >
                <span className="tree-indent">
                  {depth > 0 && (
                    <>
                      <span className="tree-line"></span>
                      <span className="tree-corner"></span>
                    </>
                  )}
                </span>
                <span className="file-icon">
                  {isMd ? '📄' : '📃'}
                </span>
                <span className="file-path">{fileItem.name}</span>
              </li>
            </div>
          )
        })}
      </>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📝 Markdown Viewer</h1>
        <div className="file-input-container">
          <label htmlFor="folder-input" className="file-input-label">
            📁 폴더 선택
          </label>
          <input
            id="folder-input"
            type="file"
            webkitdirectory="true"
            directory="true"
            onChange={handleFolderSelect}
            className="file-input"
          />
          <label htmlFor="file-input" className="file-input-label">
            📄 파일 선택
          </label>
          <input
            id="file-input"
            type="file"
            accept=".md,.markdown"
            multiple
            onChange={handleFileSelect}
            className="file-input"
          />
        </div>
      </header>

      <div className="container">
        {(fileList.length > 0 || allFiles.length > 0) && (
          <aside className="sidebar">
            <h3>파일 목록</h3>
            <ul className="file-list">
              {fileTree
                ? <FileTreeNode node={fileTree} depth={0} />
                : fileList.map((file, index) => (
                    <li
                      key={index}
                      className={`file-item ${file.name === fileName ? 'active' : ''}`}
                      onClick={() => loadFile(file)}
                    >
                      <span className="file-icon">📄</span>
                      <span className="file-path">{file.name}</span>
                    </li>
                  ))}
            </ul>
          </aside>
        )}

        <main
          className="content"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {!markdownContent ? (
            <div className="placeholder">
              <p>📁 마크다운 파일을 선택하거나 여기에 드래그하세요</p>
              <p className="hint">
                .md 또는 .markdown 파일을 지원합니다
              </p>
            </div>
          ) : (
            <div className="markdown-container">
              <div className="file-name">
                {filePath || fileName}
              </div>
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {markdownContent}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
