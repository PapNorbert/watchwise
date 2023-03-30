import React, { useEffect, useState, useContext } from 'react'

import serverUrl from '../../config/serverName'
import { convertToSelectedLanguage } from '../../i18n/conversion'
import WatchGroup from '../../components/WatchGroup'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import {LanguageContext} from '../../components/LanguageContextProvider'
import useGetFetch from '../../hooks/useGetFetch'


export default function WatchGroupsAll() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const {i18nData} = useContext(LanguageContext);
  const [url, setUrl] = useState(`${serverUrl}/api/watch_groups`)
  const {data: watch_groups, error } = useGetFetch(url)

  useEffect(() => {
    setUrl(`${serverUrl}/api/watch_groups/?page=${page}&limit=${limit}`);
  }, [limit, page])


  if( error ) {
    return <h2 className='error'>Sorry, there was an error</h2>
  }

  return (
    <>
      <Limit limit={limit} setLimit={setLimit} setPage={setPage} key='limit'/>
      { watch_groups?.data.map( currentElement => {
        return (
          <WatchGroup  watch_group={convertToSelectedLanguage(currentElement, i18nData)} key={currentElement._key}/>
        );
      })}
      <PaginationElements currentPage={page} 
        totalPages={watch_groups?.pagination.totalPages}
        onPageChange={setPage} key='pagination'/>
    </>
  )
}
