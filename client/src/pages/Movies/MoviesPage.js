import { Routes, Route, Navigate } from 'react-router-dom'

import MoviesAll from './MoviesAll'

export default function MoviesPage() {

  return (
    <>
      <h2>Movies</h2>
      <Routes>
        <Route path='' element={<MoviesAll />} />
        <Route path='*' element={<Navigate to="/error-page" />} />
      </Routes>
    </>
  )
}
