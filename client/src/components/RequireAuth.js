import { useLocation, Navigate, Outlet } from 'react-router-dom'

import useAuth from "../hooks/useAuth"
import jwt_decode from 'jwt-decode'



export default function RequireAuth({ allowedRoles }) {
  const { auth } = useAuth();
  const location = useLocation();

  const decoded = auth?.accesToken 
    ? jwt_decode(auth.accesToken)
    : undefined

  const role = decoded?.role || null

  return (
    allowedRoles?.includes(role)
      ? <Outlet />
      : auth?.accesToken
        ? <Navigate to='/unauthorized' state={{from: location}} replace />
        : <Navigate to='/login' state={{from: location}} replace />
  )
}
