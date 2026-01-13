import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import DocumentList from './components/DocumentList'
import DocumentDetail from './components/DocumentDetail'
import UploadForm from './components/UploadForm'
import SearchBar from './components/SearchBar'

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">
          <h1>DocProc</h1>
        </Link>
        <nav>
          <SearchBar />
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={
            <>
              <UploadForm onUploadSuccess={handleUploadSuccess} />
              <DocumentList refreshTrigger={refreshTrigger} />
            </>
          } />
          <Route path="/documents/:id" element={<DocumentDetail />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
