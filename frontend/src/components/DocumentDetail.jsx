import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDocument, deleteDocument, addTagsToDocument, removeTagFromDocument } from '../api'

function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newTag, setNewTag] = useState('')
  const [addingTag, setAddingTag] = useState(false)

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getDocument(id)
      setDocument(data)
    } catch {
      setError('Failed to load document')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }
    try {
      await deleteDocument(id)
      navigate('/')
    } catch {
      setError('Failed to delete document')
    }
  }

  async function handleAddTag(e) {
    e.preventDefault()
    if (!newTag.trim()) return

    try {
      setAddingTag(true)
      await addTagsToDocument(id, [newTag.trim()])
      setNewTag('')
      await loadDocument()
    } catch {
      setError('Failed to add tag')
    } finally {
      setAddingTag(false)
    }
  }

  async function handleRemoveTag(tagId) {
    try {
      await removeTagFromDocument(id, tagId)
      await loadDocument()
    } catch {
      setError('Failed to remove tag')
    }
  }

  if (loading) {
    return <div className="loading">Loading document...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  if (!document) {
    return <div className="error">Document not found</div>
  }

  return (
    <div className="document-detail">
      <h2>{document.filename}</h2>
      <div className="meta">
        <p>Status: {document.status}</p>
        <p>Pages: {document.page_count || 'Unknown'}</p>
        <p>Size: {formatFileSize(document.file_size)}</p>
        <p>Uploaded: {new Date(document.created_at).toLocaleString()}</p>
      </div>

      <div className="tags-section">
        <h3>Tags</h3>
        <div className="tags-list">
          {document.tags && document.tags.length > 0 ? (
            document.tags.map(tag => (
              <span key={tag.id} className="tag">
                {tag.name}
                <button type="button" onClick={() => handleRemoveTag(tag.id)} className="remove-tag">×</button>
              </span>
            ))
          ) : (
            <p>No tags yet</p>
          )}
        </div>
        <form onSubmit={handleAddTag} className="add-tag-form">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag..."
            disabled={addingTag}
          />
          <button type="submit" disabled={!newTag.trim() || addingTag}>
            {addingTag ? 'Adding...' : 'Add Tag'}
          </button>
        </form>
      </div>

      <h3>Extracted Content</h3>
      <div className="content">
        {document.content || 'No content extracted'}
      </div>
      <div className="actions">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          Back to List
        </button>
        <button type="button" className="delete-btn" onClick={handleDelete}>
          Delete Document
        </button>
      </div>
    </div>
  )
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default DocumentDetail
