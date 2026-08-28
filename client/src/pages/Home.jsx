import { useEffect, useState } from 'react'
import MovieRow from '../components/MovieRow.jsx'
import "../styles/home.css";

function Home() {
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMovies() {
      try {
        const [trendingRes, popularRes] = await Promise.all([
          fetch('http://localhost:5000/api/tmdb/trending'),
          fetch('http://localhost:5000/api/tmdb/popular'),
        ])
        const trendingData = await trendingRes.json()
        const popularData = await popularRes.json()
        setTrending(trendingData.results || [])
        setPopular(popularData.results || [])
      } catch (err) {
        console.error('Failed to fetch movies', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMovies()
  }, [])

  if (loading) {
    return <div className="loading-screen">Loading the marquee...</div>
  }

  return (
    <div className="home-page">
      <MovieRow title="Trending This Week" movies={trending} />
      <MovieRow title="Popular Now Showing" movies={popular} />
    </div>
  )
}

export default Home
