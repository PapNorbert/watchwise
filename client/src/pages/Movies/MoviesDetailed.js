import React from 'react'
import { useParams } from "react-router-dom"

import MovieDetails from '../../components/MovieDetails'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import useGetAxios from '../../hooks/useGetAxios'

export default function MoviesDetailed() {
  const { movieId } = useParams();
  const { i18nData } = useLanguage();
  const { data: movie, error, loading, refetch } = useGetAxios(`/api/movies/${movieId}`);
  const { data: genres, error: genreError } = useGetAxios(`/api/movies/${movieId}/genres`);

  if (loading) {
    return <h3 className='error'>{convertKeyToSelectedLanguage('loading', i18nData)}</h3>
  }

  if (error) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  if (genreError) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  return ( movie &&
    <MovieDetails movie={movie} genres={genres} key={movie._key} refetch={refetch} />
  );

}
