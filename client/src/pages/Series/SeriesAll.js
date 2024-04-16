import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from 'react-router-dom'

import Serie from '../../components/Serie'
import LimitAndSearch from '../../components/LimitAndSearch'
import PaginationElements from '../../components/PaginationElements'
import GenresFilter from '../../components/GenresFilter'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import { querryParamDefaultValues, querryParamNames, limitValues } from '../../config/querryParams'
import { useSearchParamsState } from '../../hooks/useSearchParamsState'
import useSetMultipleSearchParams from '../../hooks/useSetMultipleSearchParams'


export default function SeriesAll() {
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

  const [url, setUrl] = useState(`/api/series/?short=true`);
  const { data: series, error, statusCode } = useGetAxios(url);
  const { data: genres, error: genresError, statusCode: genreStatusCode } = useGetAxios('/api/genres');

  const { auth, setAuth, setLoginExpired } = useAuth();
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
    } else if (page > series?.pagination.totalPages && page > 1) {
      setPage(series?.pagination.totalPages);
    } else {
      // limit and page have correct values
      setUrl(`/api/series/?short=true&page=${page}&limit=${limit}&genre=${selectedGenres}&name=${nameSearch}`);
    }
  }, [limit, page, series?.pagination.totalPages, setLimit, setPage, selectedGenres, nameSearch])


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


  return (series &&
    <>
      <h1>{convertKeyToSelectedLanguage('series', i18nData)}</h1>
      <LimitAndSearch limit={limit} currentNameSearch={currentNameSearch}
        setCurrentNameSearch={setCurrentNameSearch} />
      {genres &&
        <GenresFilter genres={genres} selectedGenres={selectedGenres}
          setSelectedGenres={handleSelectedGenreChanged} key='genres-filter' />
      }
      {series.data.length > 0 ?
        series.data.map(currentElement => {
          return (
            <Serie serie={currentElement} key={currentElement._key} />
          );
        })
        :
        // no elements returned
        <h3>{convertKeyToSelectedLanguage('no_series', i18nData)}</h3>
      }
      <PaginationElements currentPage={parseInt(page)}
        totalPages={series?.pagination.totalPages}
        onPageChange={setPage} key='pagination' />
    </>
  )
}
