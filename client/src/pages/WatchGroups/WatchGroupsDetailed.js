import React, { useState } from 'react'
import { useLocation, useParams, Navigate } from "react-router-dom"

import WatchGroupDetails from '../../components/WatchGroupDetails'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import { buttonTypes } from '../../util/buttonTypes'


export default function WatchGroupsDetailed() {

  const { watchGroupId } = useParams();
  const { i18nData } = useLanguage();
  const { auth, setAuth, setLoginExpired } = useAuth();
  const [url, setUrl] = useState(`/api/watch_groups/${watchGroupId}`);
  const { data: watch_group, error, loading, statusCode, refetch } = useGetAxios(url);
  const location = useLocation();


  if (statusCode === 401) {
    if (auth.logged_in) {
      setAuth({ logged_in: false });
      setLoginExpired(true);
    }
  }

  if (statusCode === 403) {
    return <Navigate to='/unauthorized' state={{ from: location }} replace />
  }

  if (statusCode === 404) {
    return <h3 className='error text-center'>{convertKeyToSelectedLanguage('404_group', i18nData)}</h3>
  }

  if (statusCode === 503 ) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('server_no_resp', i18nData)}</h2>
  }

  if (loading) {
    return <h3 className='loading'>{convertKeyToSelectedLanguage('loading', i18nData)}</h3>
  }

  if (error) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }


  return (watch_group &&
    <WatchGroupDetails watch_group={
      watch_group?.data?.doc ? watch_group?.data?.doc : watch_group?.data
    } buttonType={
      watch_group?.data?.doc ? (watch_group?.data?.joined ? buttonTypes.leave : buttonTypes.join) : null
    } key={
      watch_group?.data?.doc ? watch_group?.data?.doc._key : watch_group?.data._key
    } setUrl={setUrl} totalPages={watch_group?.pagination.totalPages}
      refetch={refetch}
    />
  );

}
