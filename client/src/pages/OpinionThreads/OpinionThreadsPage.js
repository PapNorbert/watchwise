import { Routes, Route, Navigate } from 'react-router-dom'

import OpinionThreadsTab from './OpinionThreadsTab'
import OpinionThreadsAll from './OpinionThreadsAll'
import OpinionThreadsCreate from './OpinionThreadsCreate'
import OpinionThreadsMy from './OpinionThreadsMy'
import OpinionThreadsFollowed from './OpinionThreadsFollowed'


export default function OpinionThreadsPage() {
  return (
    <>
      <h2>Opinion Threads</h2>
      <OpinionThreadsTab />
      <Routes>
        <Route path='' element={<OpinionThreadsAll />} />
        <Route path='/joined/:userId' element={<OpinionThreadsFollowed />} />
        <Route path='/my_threads/:userId' element={<OpinionThreadsMy />} />
        <Route path='/create' element={<OpinionThreadsCreate />} />
        <Route path='*' element={<Navigate to="/error-page" />} />
      </Routes>
    </>
  )
}
