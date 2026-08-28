import { useEffect, useState } from 'react'
import MovieRow from '../components/MovieRow.jsx'
import MovieCardSkeleton from '../components/MovieCardSkeleton.jsx'
import '../styles/home.css'

function SkeletonRow({ title }) {
  return (
    <div className="movie-row">
      <h2 className="movie-row-title">{title}</h2>
      <div className="movie-row-scroll">
        {Array.from({ length: 6 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function Home() {
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMovies() {
      try {
        const [trendingRes, popularRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/tmdb/trending`),
          fetch(`${import.meta.env.VITE_API_URL}/api/tmdb/popular`),
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
    return (
      <div className="home-page">
        <SkeletonRow title="Trending This Week" />
        <SkeletonRow title="Popular Now Showing" />
      </div>
    )
  }

  return (
    <div className="home-page">
      <MovieRow title="Trending This Week" movies={trending} />
      <MovieRow title="Popular Now Showing" movies={popular} />
    </div>
  )
}

export default Home
