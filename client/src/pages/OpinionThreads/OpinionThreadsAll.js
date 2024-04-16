import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import OpinionThread from '../../components/OpinionThread'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import OpinionThreadSearchSort from '../../components/OpinionThreadSearchSort'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import { buttonTypes } from '../../config/buttonTypes'
import { querryParamDefaultValues, querryParamNames, limitValues, sortByValuesOT } from '../../config/querryParams'
import { useSearchParamsState } from '../../hooks/useSearchParamsState'


export default function OpinionThreadsAll() {
  const [limit, setLimit] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] = useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const [url, setUrl] = useState(`/api/opinion_threads`);
  const { auth, setAuth, setLoginExpired } = useAuth();
  const { data: opinion_threads, error, statusCode } = useGetAxios(url);
  const [nameSearch] =
    useSearchParamsState(querryParamNames.name, querryParamDefaultValues.name);
  const [currentNameSearch, setCurrentNameSearch] = useState(nameSearch);
  const [showSearch] =
    useSearchParamsState(querryParamNames.show, querryParamDefaultValues.show);
  const [currentShowSearch, setCurrentShowSearch] = useState(showSearch);
  const [creatorSearch] =
    useSearchParamsState(querryParamNames.creator, querryParamDefaultValues.creator);
  const [currentCreatorSearch, setCurrentCreatorSearch] = useState(creatorSearch);
  const [tagSearch] =
    useSearchParamsState(querryParamNames.tags, querryParamDefaultValues.tags);
  const [currentTagSearch, setCurrentTagSearch] = useState(tagSearch);
  const [sortBy, setSortBy] =
    useSearchParamsState(querryParamNames.sortBy, querryParamDefaultValues.OTsortBy);
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);
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
    } else if (page > opinion_threads?.pagination.totalPages && page > 1) {
      setPage(opinion_threads?.pagination.totalPages);
    } else if (!sortByValuesOT.includes(sortBy)) {
      setSortBy(querryParamDefaultValues.OTsortBy);
    } else {
      // limit and page have correct values
      let newUrl = `/api/opinion_threads/?page=${page}&limit=${limit}`;
      if (nameSearch) {
        newUrl += `&titleSearch=${nameSearch}`
      }
      if (showSearch) {
        newUrl += `&showSearch=${showSearch}`
      }
      if (tagSearch) {
        newUrl += `&tags=${tagSearch}`
      }
      if (creatorSearch) {
        newUrl += `&creatorSearch=${creatorSearch}`
      }
      if (sortBy !== querryParamDefaultValues.sortBy) {
        newUrl += `&sortBy=${sortBy}`
      }
      setUrl(newUrl);
    }
  }, [creatorSearch, limit, nameSearch, opinion_threads?.pagination.totalPages,
    page, setLimit, setPage, setSortBy, showSearch, tagSearch, sortBy])


  if (statusCode === 401) {
    if (auth.logged_in) {
      setAuth({ logged_in: false });
      setLoginExpired(true);
    }
  }

  if (statusCode === 403) {
    return <Navigate to='/unauthorized' state={{ from: location }} replace />
  }

  if (statusCode === 503) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('server_no_resp', i18nData)}</h2>
  }


  if (error) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  return (opinion_threads &&
    <>
      <OpinionThreadSearchSort currentNameSearch={currentNameSearch} setCurrentNameSearch={setCurrentNameSearch}
        currentShowSearch={currentShowSearch} setCurrentShowSearch={setCurrentShowSearch}
        currentCreatorSearch={currentCreatorSearch} setCurrentCreatorSearch={setCurrentCreatorSearch}
        currentTagSearch={currentTagSearch} setCurrentTagSearch={setCurrentTagSearch}
        currentSortBy={currentSortBy} setCurrentSortBy={setCurrentSortBy} />
      <Limit limit={limit} />
      {
        opinion_threads?.data.length > 0 ?
          opinion_threads?.data.map(currentElement => {
            return (
              <OpinionThread opinion_thread={
                currentElement?.doc ? currentElement?.doc : currentElement
              } buttonType={
                currentElement?.doc ?
                  // logged in
                  currentElement.doc.creator === auth.username ?
                    // own thread
                    buttonTypes.manage :
                    // not own thread
                    (currentElement?.followed ? buttonTypes.leave : buttonTypes.follow) : null
              } key={
                currentElement?.doc ? currentElement?.doc._key : currentElement._key
              } />
            );
          })
          :
          // no elements returned
          <h3>{convertKeyToSelectedLanguage('no_threads', i18nData)}</h3>
      }
      <PaginationElements currentPage={parseInt(page)}
        totalPages={opinion_threads?.pagination.totalPages}
        onPageChange={setPage} key='pagination-bottom' />
    </>
  )
}
