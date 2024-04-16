import React from 'react'
import { Alert } from 'react-bootstrap'

import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'

export default function LoginExpired() {
  const { loginExpired, setLoginExpired } = useAuth()
  const { i18nData } = useLanguage()

  return (
    <Alert key='danger' variant='danger' show={loginExpired} onClose={() => setLoginExpired(false)} dismissible >
      {convertKeyToSelectedLanguage('expired_jwt', i18nData)}
    </Alert>
  )
}
