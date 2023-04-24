import { useLocation, Navigate, Outlet } from 'react-router-dom'

import useAuth from "../hooks/useAuth"
import { adminRoleCode, userRoleCode } from '../config/UserRoleCodes'


export default function RequireAuth({ allowedRoles = [adminRoleCode, userRoleCode] }) {
  const { auth } = useAuth();
  const location = useLocation();

  return (
    allowedRoles?.includes(auth?.role)
      ? <Outlet />
      : auth?.logged_in
        ? <Navigate to='/unauthorized' state={{ from: location }} replace />
        : <Navigate to='/login' state={{ from: location }} replace />
  )
}
