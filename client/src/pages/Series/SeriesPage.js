import { Routes, Route, Navigate } from 'react-router-dom'

import SeriesAll from './SeriesAll'
import SeriesDetailed from './SeriesDetailed'

export default function SeriesPage() {

  return (
    <>
      <Routes>
        <Route path='' element={<SeriesAll />} />
        <Route path='/:serieId' element={<SeriesDetailed />} />
        <Route path='*' element={<Navigate to="/error-page" />} />
      </Routes>
    </>
  )
}
