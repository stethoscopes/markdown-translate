import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import './App.css'
import 'highlight.js/styles/github-dark.css'
import { generateHash, getCachedTranslation, saveCachedTranslation } from './utils/translationCache'

function App() {
  const [markdownContent, setMarkdownContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [filePath, setFilePath] = useState('')
  const [fileList, setFileList] = useState([])
  const [allFiles, setAllFiles] = useState([])
  const [fileTree, setFileTree] = useState(null)
  const [expandedFolders, setExpandedFolders] = useState(new Set())
  const [translatedContent, setTranslatedContent] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [isCached, setIsCached] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [cachedFiles, setCachedFiles] = useState(new Set())
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const [isBatchTranslating, setIsBatchTranslating] = useState(false)
  const [hideEmptyFolders, setHideEmptyFolders] = useState(false)
  const [translatingFiles, setTranslatingFiles] = useState(new Set())
  const [translatedFiles, setTranslatedFiles] = useState(new Set())

  // Refs for file inputs
  const folderInputRef = useRef(null)
  const fileInputRef = useRef(null)

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

  // Check if a folder or its subfolders contain markdown files
  const hasMdFiles = (node) => {
    // Check if this node has markdown files
    const hasMdInFiles = node.files.some(file => isMarkdownFile(file.name))
    if (hasMdInFiles) return true

    // Check if any subfolder has markdown files
    return Object.values(node.children).some(child => hasMdFiles(child))
  }

  const expandAll = () => {
    if (!fileTree) return
    const foldersWithMd = new Set()

    const collectFoldersWithMd = (node) => {
      Object.values(node.children).forEach(child => {
        // Only add folder if it or its subfolders contain md files
        if (hasMdFiles(child)) {
          foldersWithMd.add(child.path)
          collectFoldersWithMd(child)
        }
      })
    }

    collectFoldersWithMd(fileTree)
    setExpandedFolders(foldersWithMd)
  }

  const collapseAll = () => {
    setExpandedFolders(new Set())
  }

  const refreshFileList = () => {
    // Trigger folder input to re-select files
    if (fileTree && folderInputRef.current) {
      folderInputRef.current.click()
    } else if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const translateToKorean = async () => {
    if (!markdownContent) return

    setIsTranslating(true)
    setIsCached(false)

    try {
      // Generate hash of current content
      const contentHash = await generateHash(markdownContent)

      // Check cache first
      const cachedTranslation = await getCachedTranslation(filePath || fileName, contentHash)

      if (cachedTranslation) {
        // Use cached translation
        setTranslatedContent(cachedTranslation)
        setShowTranslation(true)
        setIsCached(true)
        setIsTranslating(false)
        return
      }

      // Cache miss - proceed with API call
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        alert('OpenAI API 키가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.')
        setIsTranslating(false)
        return
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Translate the given Markdown content to Korean while preserving all Markdown formatting, code blocks, links, and structure. Only translate the text content, not the Markdown syntax or code.'
            },
            {
              role: 'user',
              content: markdownContent
            }
          ],
          temperature: 0.3
        })
      })

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const translated = data.choices[0].message.content

      // Save to cache
      await saveCachedTranslation(
        filePath || fileName,
        contentHash,
        markdownContent,
        translated
      )

      setTranslatedContent(translated)
      setShowTranslation(true)
      setIsCached(false)
    } catch (error) {
      console.error('번역 오류:', error)
      alert(`번역 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsTranslating(false)
    }
  }

  const toggleTranslation = () => {
    if (!translatedContent) {
      translateToKorean()
    } else {
      setShowTranslation(!showTranslation)
    }
  }

  // Batch translation functions
  const openBatchTranslateModal = async () => {
    if (!fileTree) return

    // Get all markdown files
    const mdFiles = fileList.filter(file =>
      file.name.endsWith('.md') || file.name.endsWith('.markdown')
    )

    if (mdFiles.length === 0) {
      alert('번역할 마크다운 파일이 없습니다.')
      return
    }

    // Check cache status for all files
    const cached = new Set()
    const selected = new Set()

    for (const file of mdFiles) {
      const text = await file.text()
      const hash = await generateHash(text)
      const filePath = file.webkitRelativePath || file.name
      const cachedTranslation = await getCachedTranslation(filePath, hash)

      if (cachedTranslation) {
        cached.add(filePath)
      } else {
        selected.add(filePath)
      }
    }

    setCachedFiles(cached)
    setSelectedFiles(selected)
    setTranslatingFiles(new Set())
    setTranslatedFiles(new Set())
    setShowBatchModal(true)
  }

  const toggleFileSelection = (filePath) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(filePath)) {
        newSet.delete(filePath)
      } else {
        newSet.add(filePath)
      }
      return newSet
    })
  }

  const selectAllFiles = () => {
    const allNonCached = fileList
      .map(f => f.webkitRelativePath || f.name)
      .filter(path => !cachedFiles.has(path))
    setSelectedFiles(new Set(allNonCached))
  }

  const deselectAllFiles = () => {
    setSelectedFiles(new Set())
  }

  const executeBatchTranslation = async () => {
    if (selectedFiles.size === 0) {
      alert('번역할 파일을 선택해주세요.')
      return
    }

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      alert('OpenAI API 키가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.')
      return
    }

    setIsBatchTranslating(true)
    setBatchProgress({ current: 0, total: selectedFiles.size })

    const filesToTranslate = fileList.filter(file =>
      selectedFiles.has(file.webkitRelativePath || file.name)
    )

    let completed = 0

    try {
      // Translate files in parallel (limit to 3 concurrent requests)
      const batchSize = 3
      for (let i = 0; i < filesToTranslate.length; i += batchSize) {
        const batch = filesToTranslate.slice(i, i + batchSize)

        await Promise.all(batch.map(async (file) => {
          const filePath = file.webkitRelativePath || file.name

          try {
            // Mark as translating
            setTranslatingFiles(prev => new Set([...prev, filePath]))

            const text = await file.text()
            const hash = await generateHash(text)

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: 'You are a professional translator. Translate the given Markdown content to Korean while preserving all Markdown formatting, code blocks, links, and structure. Only translate the text content, not the Markdown syntax or code.'
                  },
                  {
                    role: 'user',
                    content: text
                  }
                ],
                temperature: 0.3
              })
            })

            if (response.ok) {
              const data = await response.json()
              const translated = data.choices[0].message.content
              await saveCachedTranslation(filePath, hash, text, translated)
              console.log(`✅ Translated and cached: ${filePath}`)

              // Mark as completed
              setTranslatingFiles(prev => {
                const newSet = new Set(prev)
                newSet.delete(filePath)
                return newSet
              })
              setTranslatedFiles(prev => new Set([...prev, filePath]))
            } else {
              console.error(`❌ Translation failed: ${filePath}`)
              // Remove from translating on failure
              setTranslatingFiles(prev => {
                const newSet = new Set(prev)
                newSet.delete(filePath)
                return newSet
              })
            }
          } catch (error) {
            console.error(`❌ Error translating ${file.name}:`, error)
            // Remove from translating on error
            setTranslatingFiles(prev => {
              const newSet = new Set(prev)
              newSet.delete(filePath)
              return newSet
            })
          } finally {
            completed++
            setBatchProgress({ current: completed, total: selectedFiles.size })
          }
        }))
      }

      alert(`일괄 번역 완료! ${completed}개 파일이 번역되었습니다.`)
      setShowBatchModal(false)
    } catch (error) {
      console.error('일괄 번역 오류:', error)
      alert(`일괄 번역 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsBatchTranslating(false)
      setBatchProgress({ current: 0, total: 0 })
    }
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

      // Collapse all folders by default
      setExpandedFolders(new Set())

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
    const path = file.webkitRelativePath || file.name
    setFilePath(path)

    // Check if translation exists in cache
    const contentHash = await generateHash(text)
    const cachedTranslation = await getCachedTranslation(path, contentHash)

    if (cachedTranslation) {
      // If cached translation exists, show it automatically
      setTranslatedContent(cachedTranslation)
      setShowTranslation(true)
      setIsCached(true)
    } else {
      // Reset translation state when no cache found
      setTranslatedContent('')
      setShowTranslation(false)
      setIsCached(false)
    }
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

  // Recursive component to render file tree in modal
  const ModalFileTreeNode = ({ node, depth = 0, hideEmpty = false, translatingSet = new Set(), translatedSet = new Set() }) => {
    if (!node) return null

    let folders = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name))

    // Filter out folders without markdown files if hideEmpty is true
    if (hideEmpty) {
      folders = folders.filter(folder => hasMdFiles(folder))
    }

    const files = node.files.sort((a, b) => a.name.localeCompare(b.name))

    return (
      <>
        {folders.map((folder) => (
          <div key={folder.path} className="modal-tree-node">
            <div
              className="modal-folder-item"
              style={{ paddingLeft: `${depth * 1.5}rem` }}
            >
              <span className="modal-tree-indent">
                {depth > 0 && (
                  <>
                    <span className="modal-tree-line"></span>
                    <span className="modal-tree-corner"></span>
                  </>
                )}
              </span>
              <span className="folder-icon">📂</span>
              <span className="folder-name">{folder.name}</span>
            </div>
            <div className="modal-tree-children">
              <ModalFileTreeNode node={folder} depth={depth + 1} hideEmpty={hideEmpty} translatingSet={translatingSet} translatedSet={translatedSet} />
            </div>
          </div>
        ))}
        {files.map((fileItem) => {
          const isMd = isMarkdownFile(fileItem.name)
          const isCached = cachedFiles.has(fileItem.path)
          const isSelected = selectedFiles.has(fileItem.path)
          const isTranslating = translatingSet.has(fileItem.path)
          const isTranslated = translatedSet.has(fileItem.path)

          if (!isMd) return null

          return (
            <div key={fileItem.path} className="modal-tree-node">
              <div
                className="modal-file-item-tree"
                style={{ paddingLeft: `${depth * 1.5}rem` }}
              >
                <label className={isCached ? 'disabled' : ''}>
                  <span className="modal-tree-indent">
                    {depth > 0 && (
                      <>
                        <span className="modal-tree-line"></span>
                        <span className="modal-tree-corner"></span>
                      </>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isCached || isBatchTranslating}
                    onChange={() => toggleFileSelection(fileItem.path)}
                  />
                  <span className="file-icon">
                    {isMd ? '📄' : '📃'}
                  </span>
                  <span className="file-path-text">{fileItem.name}</span>
                  {isCached && <span className="cached-label">(캐시됨)</span>}
                  {isTranslating && <span className="translating-label">번역중...</span>}
                  {isTranslated && <span className="translated-label">✓ 완료</span>}
                </label>
              </div>
            </div>
          )
        })}
      </>
    )
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
            ref={folderInputRef}
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
            ref={fileInputRef}
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
            <div className="sidebar-header">
              <h3>파일 목록</h3>
              <div className="sidebar-controls">
                {(fileList.length > 0 || allFiles.length > 0) && (
                  <button
                    className="tree-control-btn refresh-btn"
                    onClick={refreshFileList}
                    title="새로고침"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                      <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                    </svg>
                  </button>
                )}
                {fileTree && (
                  <div className="tree-controls">
                    <button
                      className="tree-control-btn"
                      onClick={expandAll}
                      title="Expand All"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 9.5L4 6h8L8 9.5z"/>
                        <path d="M8 13.5L4 10h8l-4 3.5z"/>
                        <path d="M8 5.5L4 2h8L8 5.5z"/>
                      </svg>
                    </button>
                    <button
                      className="tree-control-btn"
                      onClick={collapseAll}
                      title="Collapse All"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12 8L8 5v6l4-3z"/>
                        <path d="M6 8L2 5v6l4-3z"/>
                      </svg>
                    </button>
                  </div>
                )}
                {fileTree && fileList.length > 0 && (
                  <button
                    className="batch-translate-btn"
                    onClick={openBatchTranslateModal}
                    title="일괄 번역"
                  >
                    🌐 일괄 번역
                  </button>
                )}
              </div>
            </div>
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
              <div className="file-header">
                <div className="file-name">
                  {(() => {
                    const fullPath = filePath || fileName
                    const lastSlashIndex = fullPath.lastIndexOf('/')

                    if (lastSlashIndex > 0) {
                      // 경로가 있는 경우: 경로와 파일명 분리
                      const directory = fullPath.substring(0, lastSlashIndex)
                      const filename = fullPath.substring(lastSlashIndex + 1)
                      return (
                        <>
                          <div className="file-path-dir">{directory}</div>
                          <div className="file-path-name">
                            {filename}
                            {showTranslation && <span className="translation-badge">번역됨</span>}
                            {isCached && <span className="cache-badge">💾 캐시됨</span>}
                          </div>
                        </>
                      )
                    } else {
                      // 경로가 없는 경우: 파일명만 표시
                      return (
                        <div className="file-path-name">
                          {fullPath}
                          {showTranslation && <span className="translation-badge">번역됨</span>}
                          {isCached && <span className="cache-badge">💾 캐시됨</span>}
                        </div>
                      )
                    }
                  })()}
                </div>
                <div className="translation-controls">
                  {translatedContent && (
                    <button
                      className="translation-toggle-btn"
                      onClick={() => setShowTranslation(!showTranslation)}
                      title={showTranslation ? "원문 보기" : "번역 보기"}
                    >
                      {showTranslation ? '📄 원문' : '🌐 번역'}
                    </button>
                  )}
                  <button
                    className="translate-btn"
                    onClick={translateToKorean}
                    disabled={isTranslating}
                    title="한글로 번역"
                  >
                    {isTranslating ? (
                      <>
                        <span className="spinner"></span>
                        번역 중...
                      </>
                    ) : (
                      <>
                        🌐 번역
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {showTranslation ? translatedContent : markdownContent}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Batch Translation Modal */}
      {showBatchModal && (
        <div className="modal-overlay" onClick={() => !isBatchTranslating && setShowBatchModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>일괄 번역</h2>
              <button
                className="modal-close"
                onClick={() => setShowBatchModal(false)}
                disabled={isBatchTranslating}
              >
                ✕
              </button>
            </div>

            <div className="modal-controls">
              <button onClick={selectAllFiles} disabled={isBatchTranslating}>
                전체 선택
              </button>
              <button onClick={deselectAllFiles} disabled={isBatchTranslating}>
                전체 해제
              </button>
              <button onClick={() => setHideEmptyFolders(!hideEmptyFolders)} disabled={isBatchTranslating}>
                {hideEmptyFolders ? '빈 폴더 보기' : '빈 폴더 숨기기'}
              </button>
              <div className="file-count">
                선택됨: {selectedFiles.size} / {fileList.length}
              </div>
            </div>

            <div className="modal-file-list">
              {fileTree ? (
                <ModalFileTreeNode node={fileTree} depth={0} hideEmpty={hideEmptyFolders} translatingSet={translatingFiles} translatedSet={translatedFiles} />
              ) : (
                fileList.map((file) => {
                  const filePath = file.webkitRelativePath || file.name
                  const isCached = cachedFiles.has(filePath)
                  const isSelected = selectedFiles.has(filePath)
                  const isMd = file.name.endsWith('.md') || file.name.endsWith('.markdown')
                  const isTranslating = translatingFiles.has(filePath)
                  const isTranslated = translatedFiles.has(filePath)

                  if (!isMd) return null

                  return (
                    <div key={filePath} className="modal-file-item">
                      <label className={isCached ? 'disabled' : ''}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isCached || isBatchTranslating}
                          onChange={() => toggleFileSelection(filePath)}
                        />
                        <span className="file-path-text">{filePath}</span>
                        {isCached && <span className="cached-label">(캐시됨)</span>}
                        {isTranslating && <span className="translating-label">번역중...</span>}
                        {isTranslated && <span className="translated-label">✓ 완료</span>}
                      </label>
                    </div>
                  )
                })
              )}
            </div>

            {isBatchTranslating && (
              <div className="modal-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {batchProgress.current} / {batchProgress.total} 완료
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowBatchModal(false)}
                disabled={isBatchTranslating}
              >
                취소
              </button>
              <button
                className="modal-submit"
                onClick={executeBatchTranslation}
                disabled={isBatchTranslating || selectedFiles.size === 0}
              >
                {isBatchTranslating ? '번역 중...' : `번역 시작 (${selectedFiles.size}개)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
