import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getDocuments } from '../api'

function DocumentList({ refreshTrigger }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getDocuments()
      setDocuments(data)
    } catch {
      setError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [refreshTrigger, loadDocuments])

  if (loading) {
    return <div className="loading">Loading documents...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="document-list">
      <h2>Documents</h2>
      {documents.length === 0 ? (
        <div className="empty-state">
          No documents uploaded yet. Upload a PDF to get started.
        </div>
      ) : (
        documents.map(doc => (
          <div key={doc.id} className="document-item">
            <div>
              <Link to={`/documents/${doc.id}`}>{doc.filename}</Link>
              <div className="document-meta">
                {doc.page_count} pages | {formatFileSize(doc.file_size)} | {doc.status}
              </div>
            </div>
            <div className="document-meta">
              {new Date(doc.created_at).toLocaleDateString()}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default DocumentList
