import React from 'react'
import { useParams } from "react-router-dom"

import MovieDetails from '../../components/MovieDetails'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import useGetAxios from '../../hooks/useGetAxios'

export default function MoviesDetailed() {
  const { movieId } = useParams();
  const { i18nData } = useLanguage();
  const { data: movie, error, loading } = useGetAxios(`/api/movies/${movieId}`);

  if (loading) {
    return <h3 className='error'>{convertKeyToSelectedLanguage('loading', i18nData)}</h3>
  }

  if (error) {
    return <h2 className='error'>Sorry, there was an error</h2>
  }


  return ( movie &&
    <MovieDetails movie={movie} key={movie._key} />
  );

}
