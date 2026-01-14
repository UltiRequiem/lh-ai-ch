// Generate consistent colors for tags based on tag name
// Uses a simple hash function to ensure same tag always gets same color

const TAG_COLORS = [
  { bg: '#e8f4f8', text: '#2c3e50' }, // Blue
  { bg: '#f0e8f8', text: '#2c3e50' }, // Purple
  { bg: '#e8f8f0', text: '#2c3e50' }, // Green
  { bg: '#f8f0e8', text: '#2c3e50' }, // Orange
  { bg: '#f8e8f0', text: '#2c3e50' }, // Pink
  { bg: '#f8f8e8', text: '#2c3e50' }, // Yellow
  { bg: '#e8f0f8', text: '#2c3e50' }, // Light blue
  { bg: '#f0f8e8', text: '#2c3e50' }, // Lime
  { bg: '#f8e8e8', text: '#2c3e50' }, // Red
  { bg: '#e8e8f8', text: '#2c3e50' }, // Lavender
]

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export function getTagColor(tagName) {
  const hash = hashString(tagName)
  const colorIndex = hash % TAG_COLORS.length
  return TAG_COLORS[colorIndex]
}
