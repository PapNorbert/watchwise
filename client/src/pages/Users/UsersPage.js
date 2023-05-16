import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import Users from './Users'
import ModeratorRequests from './ModeratorRequests'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'


export default function UsersPage() {
  const { i18nData } = useLanguage();

  
  return (
    <>
      <h1>{convertKeyToSelectedLanguage('users', i18nData)}</h1>
      <Routes>
        <Route path='' element={<Users />} />
        <Route path='/moderators' element={<Users moderatorsOnly={true} />} />
        <Route path='/moderator_request' element={<ModeratorRequests />} />
        <Route path='*' element={<Navigate to="/error-page" />} />
      </Routes>
    </>
  )
}
