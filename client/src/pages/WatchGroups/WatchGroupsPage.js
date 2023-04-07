import { Routes, Route, Navigate } from 'react-router-dom'

import WatchGroupsAll from './WatchGroupsAll'
import WatchGroupsJoined from './WatchGroupsJoined'
import WatchGroupsTab from './WatchGroupsTab'
import WatchGroupsMy from './WatchGroupsMy'
import WatchGroupsCreate from './WatchGroupsCreate'

export default function WatchGroups() {

  return (
    <>
      <h2>Watch Groups</h2>
      <WatchGroupsTab />
      <Routes>
        <Route path='' element={<WatchGroupsAll />} />
        <Route path='/joined/:userId' element={<WatchGroupsJoined />} />
        <Route path='/my_groups/:userId' element={<WatchGroupsMy />} />
        <Route path='/create' element={<WatchGroupsCreate />} />
        <Route path='*' element={<Navigate to="/error-page" />} />
      </Routes>
    </>
  )
}
