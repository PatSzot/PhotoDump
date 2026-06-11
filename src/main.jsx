import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import CollectionsPage from './pages/CollectionsPage.jsx'
import CollectionDetailPage from './pages/CollectionDetailPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:slug" element={<CollectionDetailPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
