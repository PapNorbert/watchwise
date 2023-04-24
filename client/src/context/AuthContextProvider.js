import React, { createContext, useEffect, useState } from 'react'

import { getAxios } from '../axiosRequests/GetAxios'
import decodeJwtAccesToken from '../cookie/decodeJwt'


export const AuthContext = createContext(null);


export default function AuthContextProvider({ children }) {

  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    }) 
  }, []);

  return ( !loading &&
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
