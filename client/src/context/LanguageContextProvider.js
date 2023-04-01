import React, {createContext, useState, useEffect} from 'react'

import useGetAxios from '../axiosRequests/useGetAxios'

export const LanguageContext = createContext(null);

export default function LanguageContextProvider({children}) {
  const [language, setLanguage] = useState('eng');
  const [url, setUrl] = useState(`/api/language/eng`)
  const {data: i18nData } = useGetAxios(url)

  useEffect(() => {
    setUrl(`/api/language/${language}`);
  }, [language])


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
