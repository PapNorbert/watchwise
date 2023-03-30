import Axios from 'axios';
import React, {createContext, useState, useEffect} from 'react'

import serverUrl from '../config/serverName'


export const LanguageContext = createContext(null);

export default function LanguageContextProvider({children}) {
  const [language, setLanguage] = useState('eng');
  const [i18nData, setI18nData] = useState();

  useEffect(() =>  {
    const controller = new AbortController();
    const signal = controller.signal;
    Axios.get(`${serverUrl}/api/language/${language}`,
      { 
        signal: signal
      })
    .then((res) => {
      setI18nData(res.data);
    })
    .catch((err) => {
      if(!Axios.isCancel(err)) {
        console.log('Error obtaining language data', err);
      }
      
    })
    return () => {
      controller.abort();
    }      
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
