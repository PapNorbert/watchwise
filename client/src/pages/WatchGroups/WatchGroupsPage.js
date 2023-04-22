import { Routes, Route, Navigate } from 'react-router-dom'

import WatchGroupsAll from './WatchGroupsAll'
import WatchGroupsJoined from './WatchGroupsJoined'
import WatchGroupsTab from './WatchGroupsTab'
import WatchGroupsMy from './WatchGroupsMy'
import WatchGroupsCreate from './WatchGroupsCreate'
import WatchGroupsDetailed from './WatchGroupsDetailed'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'

export default function WatchGroups() {
  const { i18nData } = useLanguage();

  return (
    <>
      <h2>{convertKeyToSelectedLanguage('watch_groups', i18nData)}</h2>
      <WatchGroupsTab />
      <Routes>
        <Route path='' element={<WatchGroupsAll />} />
        <Route path='/:watchGroupId' element={<WatchGroupsDetailed />} />
        <Route path='/joined/:userId' element={<WatchGroupsJoined />} />
        <Route path='/my_groups/:userId' element={<WatchGroupsMy />} />
        <Route path='/create' element={<WatchGroupsCreate />} />
        <Route path='*' element={<Navigate to="/error-page" />} />
      </Routes>
    </>
  )
}
