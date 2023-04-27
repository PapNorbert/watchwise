import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from 'react-router-dom'

import Movie from '../../components/Movie'
import LimitAndSearch from '../../components/LimitAndSearch'
import PaginationElements from '../../components/PaginationElements'
import GenresFilter from '../../components/GenresFilter'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import { querryParamDefaultValues, querryParamNames, limitValues } from '../../util/querryParams'
import { useSearchParamsState } from '../../hooks/useSearchParamsState'
import useSetMultipleSearchParams from '../../hooks/useSetMultipleSearchParams'


export default function MoviesAll() {
  const [setMultipleSearchParams] = useSetMultipleSearchParams();
  const [limit, setLimit] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] =
    useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const [selectedGenres] =
    useSearchParamsState(querryParamNames.genres, querryParamDefaultValues.genres);
  const [nameSearch] =
    useSearchParamsState(querryParamNames.name, querryParamDefaultValues.name);
  const [currentNameSearch, setCurrentNameSearch] = useState(nameSearch);

  const [url, setUrl] = useState(`/api/movies/?short=true`);
  const { data: movies, error, statusCode } = useGetAxios(url);
  const { data: genres, error: genresError, statusCode: genreStatusCode } = useGetAxios('/api/genres');

  const { auth, setAuth, setLoginExpired } = useAuth()
  const location = useLocation();
  const { i18nData } = useLanguage();

  useEffect(() => {
    // eslint-disable-next-line eqeqeq
    if (parseInt(limit) != limit) {
      setLimit(querryParamDefaultValues.limit);
      // eslint-disable-next-line eqeqeq
    } else if (parseInt(page) != page) {
      setPage(querryParamDefaultValues.page);
    } else if (!limitValues.includes(parseInt(limit))) {
      setLimit(querryParamDefaultValues.limit);
    } else if (page > movies?.pagination.totalPages && page > 1) {
      setPage(movies?.pagination.totalPages);
    } else {
      // limit and page have correct values
      setUrl(`/api/movies/?short=true&page=${page}&limit=${limit}&genre=${selectedGenres}&name=${nameSearch}`);
    }
  }, [limit, movies?.pagination.totalPages, nameSearch, page, selectedGenres, setLimit, setPage])

  function handleSelectedGenreChanged(newSelectedGenre) {
    setMultipleSearchParams(
      [querryParamNames.genres],
      [newSelectedGenre],
      [querryParamNames.name, querryParamNames.page]
    );
    setCurrentNameSearch(querryParamDefaultValues.name);
  }

  if (statusCode === 401 || genreStatusCode === 401) {
    if (auth.logged_in) {
      setAuth({ logged_in: false });
      setLoginExpired(true);
    }
  }

  if (statusCode === 403 || genreStatusCode === 403) {
    return <Navigate to='/unauthorized' state={{ from: location }} replace />
  }

  if (statusCode === 503 || genreStatusCode === 503) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('server_no_resp', i18nData)}</h2>
  }


  if (error) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }
  if (genresError) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  return (movies &&
    <>
      <h1>{convertKeyToSelectedLanguage('movies', i18nData)}</h1>
      <LimitAndSearch limit={limit} currentNameSearch={currentNameSearch}
        setCurrentNameSearch={setCurrentNameSearch} />
      {genres &&
        <GenresFilter genres={genres} selectedGenres={selectedGenres}
          setSelectedGenres={handleSelectedGenreChanged} key='genres-filter' />
      }
      {movies.data.length > 0 ?
        movies.data.map(currentElement => {
          return (
            <Movie movie={currentElement} key={currentElement._key} />
          );
        })
        :
        // no elements returned
        <h2>{convertKeyToSelectedLanguage('no_movies', i18nData)}</h2>
      }
      <PaginationElements currentPage={parseInt(page)}
        totalPages={movies?.pagination.totalPages}
        onPageChange={setPage} key='pagination' />
    </>
  )
}
