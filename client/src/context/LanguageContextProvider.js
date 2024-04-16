import React, { createContext, useState, useEffect } from 'react'

import useGetAxios from '../hooks/useGetAxios'
import useAuth from '../hooks/useAuth'
import { getLanguageCookie, setLanguageCookie } from '../cookie/languageCookie'

export const LanguageContext = createContext(null);

export default function LanguageContextProvider({ children }) {
  const [language, setLanguage] = useState(getLanguageCookie());
  const [url, setUrl] = useState(`/api/language/eng`);
  const { data: i18nData, refetch, statusCode } = useGetAxios(url);
  const { auth, setAuth, setLoginExpired } = useAuth();


  if (statusCode === 401) {
    if (auth.logged_in) {
      setAuth({ logged_in: false });
      setLoginExpired(true);
      refetch();
    }
  }

  useEffect(() => {
    setLanguageCookie(language);
    setUrl(`/api/language/${language}`);
  }, [language]);


  const value = {
    language,
    setLanguage,
    i18nData
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
