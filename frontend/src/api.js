const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

export async function getDocuments() {
  const response = await fetch(`${API_BASE}/documents`);
  return response.json();
}

export async function getDocument(id) {
  const response = await fetch(`${API_BASE}/documents/${id}`);
  return response.json();
}

export async function deleteDocument(id) {
  const response = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function searchDocuments(query) {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  return response.json();
}

export async function getTags() {
  const response = await fetch(`${API_BASE}/tags`);
  return response.json();
}

export async function addTagsToDocument(documentId, tagNames) {
  const response = await fetch(`${API_BASE}/documents/${documentId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_names: tagNames }),
  });
  return response.json();
}

export async function removeTagFromDocument(documentId, tagId) {
  const response = await fetch(`${API_BASE}/documents/${documentId}/tags/${tagId}`, {
    method: 'DELETE',
  });
  return response.json();
}
