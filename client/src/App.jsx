import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import MovieDetail from './pages/MovieDetail.jsx'
import ManageAddons from './pages/ManageAddons.jsx'
import SearchResults from './pages/SearchResults.jsx'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/addons" element={<ManageAddons />} />
        <Route path="/search" element={<SearchResults />} />
      </Routes>
    </>
  )
}

export default App
