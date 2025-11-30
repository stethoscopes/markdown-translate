import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import './App.css'
import 'highlight.js/styles/github-dark.css'

function App() {
  const [markdownContent, setMarkdownContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileList, setFileList] = useState([])

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)
    const mdFiles = files.filter(file => file.name.endsWith('.md'))

    if (mdFiles.length > 0) {
      setFileList(mdFiles)
      // Load the first file by default
      loadFile(mdFiles[0])
    }
  }

  const loadFile = async (file) => {
    const text = await file.text()
    setMarkdownContent(text)
    setFileName(file.name)
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
          <label htmlFor="file-input" className="file-input-label">
            파일 선택
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
        {fileList.length > 0 && (
          <aside className="sidebar">
            <h3>파일 목록</h3>
            <ul className="file-list">
              {fileList.map((file, index) => (
                <li
                  key={index}
                  className={file.name === fileName ? 'active' : ''}
                  onClick={() => loadFile(file)}
                >
                  {file.name}
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
              <div className="file-name">{fileName}</div>
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
