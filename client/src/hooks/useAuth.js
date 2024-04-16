import { useContext } from 'react'

import { AuthContext } from '../context/AuthContextProvider'

export default function useAuth() {
  return useContext(AuthContext);
}