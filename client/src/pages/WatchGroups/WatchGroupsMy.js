import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import WatchGroup from '../../components/WatchGroup'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import WatchGroupSearchSort from '../../components/WatchGroupSearchSort'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import { buttonTypes } from '../../config/buttonTypes'
import { querryParamDefaultValues, querryParamNames, limitValues, sortByValuesWG } from '../../config/querryParams'
import { useSearchParamsState } from '../../hooks/useSearchParamsState'


export default function WatchGroupsMy() {
  const [limit, setLimit] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] = useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const { auth, setAuth, setLoginExpired } = useAuth();
  const [url, setUrl] = useState(`/api/watch_groups/?creator=${auth?.username}`);
  const { data: watch_groups, error, statusCode, loading } = useGetAxios(url);
  const { i18nData } = useLanguage();
  const location = useLocation();
  const [userLocation, setUserLocation] = useState([null, null]);
  const [locationAvailable, setLocationAvailable] = useState(false);
  // sorting filtering states
  const [nameSearch] =
    useSearchParamsState(querryParamNames.name, querryParamDefaultValues.name);
  const [currentNameSearch, setCurrentNameSearch] = useState(nameSearch);
  const [showSearch] =
    useSearchParamsState(querryParamNames.show, querryParamDefaultValues.show);
  const [currentShowSearch, setCurrentShowSearch] = useState(showSearch);
  const [creatorSearch] =
    useSearchParamsState(querryParamNames.creator, querryParamDefaultValues.creator);
  const [currentCreatorSearch, setCurrentCreatorSearch] = useState(creatorSearch);
  const [watchDateSearch] =
    useSearchParamsState(querryParamNames.watchDate, querryParamDefaultValues.watchDate);
  const [currentWatchDateSearch, setCurrentWatchDateSearch] = useState(watchDateSearch);
  const [locationSearch] =
    useSearchParamsState(querryParamNames.location, querryParamDefaultValues.location);
  const [currentLocationSearch, setCurrentLocationSearch] = useState(locationSearch);
  const [maxDistanceSearch] =
    useSearchParamsState(querryParamNames.distance, querryParamDefaultValues.distance);
  const [currentMaxDistanceSearch, setCurrentMaxDistanceSearch] = useState(maxDistanceSearch);
  const [onlyNotFullGroupsSearch] =
    useSearchParamsState(querryParamNames.onlyGroupFull, querryParamDefaultValues.onlyGroupFull);
  const [currentOnlyNotFullGroupsSearch, setCurrentOnlyNotFullGroupsSearch] = useState(onlyNotFullGroupsSearch);
  const [sortBy, setSortBy] =
    useSearchParamsState(querryParamNames.sortBy, querryParamDefaultValues.OTsortBy);
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);


  useEffect(() => {
    if (!locationAvailable) {
      // update position if location of user is available
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation([
          position.coords.latitude,
          position.coords.longitude
        ]);
        setLocationAvailable(true);
        setSortBy(querryParamDefaultValues.WGsortBy);
        setCurrentSortBy(querryParamDefaultValues.WGsortBy);
      },
        (err) => {
          if (err.code === 1) {
            // user denied location
          } else {
            console.log(err.message);
          }
        }
      );
    }
  }, [locationAvailable, setSortBy])

  useEffect(() => {
    // eslint-disable-next-line eqeqeq
    if (parseInt(limit) != limit) {
      setLimit(querryParamDefaultValues.limit);
      // eslint-disable-next-line eqeqeq
    } else if (parseInt(page) != page) {
      setPage(querryParamDefaultValues.page);
    } else if (!limitValues.includes(parseInt(limit))) {
      setLimit(querryParamDefaultValues.limit);
    } else if (page > watch_groups?.pagination.totalPages && page > 1) {
      setPage(watch_groups?.pagination.totalPages);
    } else if (!sortByValuesWG.includes(sortBy)) {
      if (locationAvailable) {
        setCurrentSortBy(querryParamDefaultValues.WGsortBy);
      } else {
        setCurrentSortBy(querryParamDefaultValues.OTsortBy);
      }
    } else {
      // limit and page have correct values
      let newUrl = `/api/watch_groups/?creator=${auth?.username}&page=${page}&limit=${limit}`;

      if (locationSearch) {
        newUrl += `&locationSearch=${locationSearch}`
      } else {
        if (userLocation[0] && userLocation[1]) {
          newUrl += `&userLocLat=${userLocation[0]}&userLocLong=${userLocation[1]}`;
        }
      }

      if (maxDistanceSearch) {
        newUrl += `&maxDistanceSearch=${maxDistanceSearch}`
      }
      if (nameSearch) {
        newUrl += `&titleSearch=${nameSearch}`
      }
      if (showSearch) {
        newUrl += `&showSearch=${showSearch}`
      }
      if (creatorSearch) {
        newUrl += `&creatorSearch=${creatorSearch}`
      }
      if (watchDateSearch) {
        newUrl += `&watchDateSearch=${watchDateSearch}`
      }
      if (onlyNotFullGroupsSearch) {
        newUrl += `&onlyNotFullSearch=${onlyNotFullGroupsSearch}`
      }
      if (sortBy) {
        newUrl += `&sortBy=${sortBy}`
      }

      setUrl(newUrl);
    }

  }, [limit, page, auth?.username, watch_groups?.pagination.totalPages, setLimit,
    setPage, userLocation, sortBy, setSortBy, locationSearch, maxDistanceSearch, onlyNotFullGroupsSearch,
    nameSearch, showSearch, creatorSearch, watchDateSearch, locationAvailable]
  )


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

  if (loading) {
    return <h3 className='error'>{convertKeyToSelectedLanguage('loading', i18nData)}</h3>
  }

  if (error) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  return (watch_groups &&
    <>
      <WatchGroupSearchSort currentNameSearch={currentNameSearch} setCurrentNameSearch={setCurrentNameSearch}
        currentShowSearch={currentShowSearch} setCurrentShowSearch={setCurrentShowSearch}
        currentCreatorSearch={currentCreatorSearch} setCurrentCreatorSearch={setCurrentCreatorSearch}
        currentSortBy={currentSortBy} setCurrentSortBy={setCurrentSortBy}
        currentWatchDateSearch={currentWatchDateSearch} setCurrentWatchDateSearch={setCurrentWatchDateSearch}
        currentLocationSearch={currentLocationSearch} setCurrentLocationSearch={setCurrentLocationSearch}
        currentMaxDistanceSearch={currentMaxDistanceSearch} setCurrentMaxDistanceSearch={setCurrentMaxDistanceSearch}
        currentOnlyNotFullGroupsSearch={currentOnlyNotFullGroupsSearch} setCurrentOnlyNotFullGroupsSearch={setCurrentOnlyNotFullGroupsSearch}
        locationAvailable={locationAvailable} withCreator={false}
      />
      <Limit limit={limit} key='limit' />
      {watch_groups?.data.length > 0 ?
        // there are elements returned
        watch_groups?.data.map(currentElement => {
          return (
            <WatchGroup watch_group={currentElement} buttonType={buttonTypes.manage} key={currentElement._key} />
          );
        }) :
        // no elements returned
        <h3>{convertKeyToSelectedLanguage('no_own_groups', i18nData)}</h3>
      }
      <PaginationElements currentPage={parseInt(page)}
        totalPages={watch_groups?.pagination.totalPages}
        onPageChange={setPage} key='pagination-bottom' />
    </>
  )

}
