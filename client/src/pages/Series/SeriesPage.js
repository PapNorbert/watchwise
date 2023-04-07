import { Routes, Route, Navigate } from 'react-router-dom'

import SeriesAll from './SeriesAll'

export default function SeriesPage() {

  return (
    <>
      <h2>Movies</h2>
      <Routes>
        <Route path='' element={<SeriesAll />} />
        <Route path='*' element={<Navigate to="/error-page" />} />
      </Routes>
    </>
  )
}
