import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { searchDocuments } from '../api'

function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return

    try {
      setSearching(true)
      const data = await searchDocuments(query)
      setResults(data)
      setShowResults(true)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setSearching(false)
    }
  }

  function handleClearSearch() {
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div className="search-container" ref={searchRef}>
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {query && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={handleClearSearch}
            title="Clear search"
          >
            ×
          </button>
        )}
        <button type="submit" disabled={searching || !query.trim()}>
          {searching ? '...' : 'Search'}
        </button>
      </form>
      {showResults && (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="result-item no-results">
              <div className="no-results-icon">🔍</div>
              <div className="no-results-text">No results found for "{query}"</div>
            </div>
          ) : (
            <>
              <div className="search-results-header">
                {results.length} {results.length === 1 ? 'result' : 'results'} found
              </div>
              {results.map(result => (
                <Link
                  key={result.id}
                  to={`/documents/${result.id}`}
                  className="result-item"
                  onClick={() => setShowResults(false)}
                >
                  <div className="result-filename">📄 {result.filename}</div>
                  {result.snippet && (
                    <div className="snippet">{result.snippet}</div>
                  )}
                </Link>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
