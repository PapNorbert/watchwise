import { Routes, Route, Navigate } from 'react-router-dom'

import OpinionThreadsTab from './OpinionThreadsTab'
import OpinionThreadsAll from './OpinionThreadsAll'
import OpinionThreadsCreate from './OpinionThreadsCreate'
import OpinionThreadsMy from './OpinionThreadsMy'
import OpinionThreadsFollowed from './OpinionThreadsFollowed'
import OpinionThreadsDetailed from './OpinionThreadsDetailed'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'

export default function OpinionThreadsPage() {
  const { i18nData } = useLanguage();

  return (
    <>
      <h2>{convertKeyToSelectedLanguage('opinion_threads', i18nData)}</h2>
      <OpinionThreadsTab />
      <Routes>
        <Route path='' element={<OpinionThreadsAll />} />
        <Route path='/:opinionThreadId' element={<OpinionThreadsDetailed />} />
        <Route path='/followed/:userId' element={<OpinionThreadsFollowed />} />
        <Route path='/my_threads/:userId' element={<OpinionThreadsMy />} />
        <Route path='/create' element={<OpinionThreadsCreate />} />
        <Route path='*' element={<Navigate to="/error-page" />} />
      </Routes>
    </>
  )
}
