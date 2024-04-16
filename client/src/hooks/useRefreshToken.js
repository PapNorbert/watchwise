import useAuth from './useAuth'
import useGetAxios from '../hooks/useGetAxios'
import decodeJwtAccesToken from '../cookie/decodeJwt'


export default function useRefreshToken() {
  const { setAuth } = useAuth();
  const { data, refetch } = useGetAxios('/api/auth/refresh');

  async function refresh() {
    refetch();
    setAuth(decodeJwtAccesToken(data?.accesToken || null));
    return data?.accesToken || null
  }

  return refresh;
}
