import { Routes, Route, Navigate } from 'react-router-dom'

import WatchGroupsAll from './WatchGroupsAll'
import WatchGroupsJoined from './WatchGroupsJoined'
import WatchGroupsTab from './WatchGroupsTab'

export default function WatchGroups() {

  return (
    <>
      <h2>Watch Groups</h2>
      <WatchGroupsTab />
      <Routes>
        <Route path='' element={<WatchGroupsAll />} />
        <Route path='/joined' element={<WatchGroupsJoined />} />
        <Route path='*' element={ <Navigate to="/error-page" /> } />
      </Routes>
    </>
  )
}
