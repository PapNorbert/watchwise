import React from 'react'
import { useParams } from "react-router-dom"

import SerieDetails from '../../components/SerieDetails'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import useGetAxios from '../../hooks/useGetAxios'

export default function SeriesDetailed() {
  const { serieId } = useParams();
  const { i18nData } = useLanguage();
  const { data: serie, error, loading , refetch} = useGetAxios(`/api/series/${serieId}`);
  const { data: genres, error: genreError } = useGetAxios(`/api/series/${serieId}/genres`);

  if (loading) {
    return <h3 className='error'>{convertKeyToSelectedLanguage('loading', i18nData)}</h3>
  }

  if (error) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  if (genreError) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }
  
  return ( serie &&
    <SerieDetails serie={serie} genres={genres} key={serie?._key} refetch={refetch} />
  );

}
