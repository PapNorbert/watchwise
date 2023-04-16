import React, { useState } from 'react'
import { useLocation, useParams, Navigate } from "react-router-dom"

import OpinionThreadDetails from '../../components/OpinionThreadDetails'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'


export default function OpinionThreadsDetailed() {

  const { serieId } = useParams();
  const { i18nData } = useLanguage();
  const { auth, setAuth, setLoginExpired } = useAuth();
  const [url, setUrl] = useState(`/api/opinion_threads/${serieId}`);
  const { data: opinion_thread, error, loading, statusCode, refetch } = useGetAxios(url);
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


  if (loading) {
    return <h3 className='error'>{convertKeyToSelectedLanguage('loading', i18nData)}</h3>
  }

  if (error) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }


  return (opinion_thread &&
    <OpinionThreadDetails opinion_thread={
      opinion_thread?.data?.doc ? opinion_thread?.data?.doc : opinion_thread?.data
    } buttonType={
      opinion_thread?.data?.doc ? (opinion_thread?.data?.followed ? 'leave' : 'follow') : null
    } key={
      opinion_thread?.data?.doc ? opinion_thread?.data?.doc._key : opinion_thread?.data._key
    } setUrl={setUrl} totalPages={opinion_thread?.pagination.totalPages}
      refetch={refetch}
    />
  );

}
