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

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)
    const mdFiles = files.filter(file => file.name.endsWith('.md'))

    if (mdFiles.length > 0) {
      setFileList(mdFiles)
      setAllFiles([])
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
              {allFiles.length > 0
                ? allFiles.map((file, index) => {
                    const relativePath = file.webkitRelativePath || file.name
                    const isMd = isMarkdownFile(file.name)
                    const isActive = relativePath === filePath

                    return (
                      <li
                        key={index}
                        className={`${isActive ? 'active' : ''} ${!isMd ? 'disabled' : ''}`}
                        onClick={() => isMd && loadFile(file)}
                        title={relativePath}
                      >
                        <span className="file-icon">
                          {isMd ? '📄' : '📃'}
                        </span>
                        <span className="file-path">{relativePath}</span>
                      </li>
                    )
                  })
                : fileList.map((file, index) => (
                    <li
                      key={index}
                      className={file.name === fileName ? 'active' : ''}
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
