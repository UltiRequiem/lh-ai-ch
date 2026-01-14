import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getDocuments, getTags, deleteDocument } from "../api";
import { getTagColor } from "../utils/tagColors";

function DocumentList({ refreshTrigger }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadTags = useCallback(async () => {
    try {
      const tags = await getTags();
      setAvailableTags(tags);
    } catch {
      // Silently fail - tags are optional
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: It's a trigger
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDocuments(selectedTag);
      setDocuments(data);
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTag, refreshTrigger]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: It's a trigger
  useEffect(() => {
    loadDocuments();
  }, [refreshTrigger, loadDocuments]);

  const handleTagClick = (tagName) => {
    setSelectedTag(selectedTag === tagName ? null : tagName);
  };

  const handleDelete = async (docId, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      setDeletingId(docId);
      await deleteDocument(docId);
      await loadDocuments();
    } catch {
      setError("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading documents...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="document-list">
      <h2>Documents</h2>
      {availableTags.length > 0 && (
        <div className="tag-filter-section">
          <div className="tag-filter-label">Filter by tag:</div>
          <div className="tag-filter-options">
            {availableTags.map((tag) => {
              const colors = getTagColor(tag.name);
              return (
                <button
                  key={tag.id}
                  className={`tag-filter-btn ${
                    selectedTag === tag.name ? "active" : ""
                  }`}
                  onClick={() => handleTagClick(tag.name)}
                  type="button"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                  }}
                >
                  {tag.name}
                </button>
              );
            })}
            {selectedTag && (
              <button
                className="tag-filter-clear"
                onClick={() => setSelectedTag(null)}
                type="button"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}
      {documents.length === 0 ? (
        <div className="empty-state">
          {selectedTag
            ? `No documents found with tag "${selectedTag}".`
            : "No documents uploaded yet. Upload a PDF to get started."}
        </div>
      ) : (
        documents.map((doc) => (
          <div key={doc.id} className="document-item">
            <div>
              <Link to={`/documents/${doc.id}`}>{doc.filename}</Link>
              <div className="document-meta">
                {doc.page_count} pages | {formatFileSize(doc.file_size)} |{" "}
                {doc.status}
              </div>
              {doc.tags && doc.tags.length > 0 && (
                <div className="document-tags">
                  {doc.tags.map((tag) => {
                    const colors = getTagColor(tag.name);
                    return (
                      <span
                        key={tag.id}
                        className="tag"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                        }}
                      >
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="document-actions">
              <div className="document-meta">
                {new Date(doc.created_at).toLocaleDateString()}
              </div>
              <button
                type="button"
                className="delete-doc-btn"
                onClick={() => handleDelete(doc.id, doc.filename)}
                disabled={deletingId === doc.id}
                title={`Delete ${doc.filename}`}
              >
                {deletingId === doc.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default DocumentList;
