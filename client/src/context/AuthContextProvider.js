import React, { createContext, useEffect, useState } from 'react'

import { getAxios } from '../axiosRequests/GetAxios'
import decodeJwtAccesToken from '../cookie/decodeJwt'


export const AuthContext = createContext(null);


export default function AuthContextProvider({ children }) {

  const [auth, setAuth] = useState({ logged_in: false });
  const [loginExpired, setLoginExpired] = useState(false);

  const value = {
    auth,
    setAuth,
    loginExpired,
    setLoginExpired
  }

  useEffect(() => {
    getAxios('/api/auth/refresh')
    .then((response) => {
      setAuth(decodeJwtAccesToken(response?.data?.accesToken || null));
      // if logged in sets userID, username, role, logged_in
      // otherwise sets logged_in to false
    }) 
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
