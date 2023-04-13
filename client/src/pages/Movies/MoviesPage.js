import { Routes, Route, Navigate } from 'react-router-dom'

import MoviesAll from './MoviesAll'
import MoviesDetailed from './MoviesDetailed'

export default function MoviesPage() {

  return (
    <>
      <Routes>
        <Route path='' element={<MoviesAll />} />
        <Route path='/:movieId' element={<MoviesDetailed />} />
        <Route path='*' element={<Navigate to="/error-page" />} />
      </Routes>
    </>
  )
}
