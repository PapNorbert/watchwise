import React, { useEffect, useState, useContext } from 'react'

import { convertToSelectedLanguage } from '../../i18n/conversion'
import WatchGroup from '../../components/WatchGroup'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import {LanguageContext} from '../../context/LanguageContextProvider'
import useGetAxios from '../../axiosRequests/useGetAxios'


export default function WatchGroupsAll() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const {i18nData} = useContext(LanguageContext);
  const [url, setUrl] = useState(`/api/watch_groups`)
  const {data: watch_groups, error } = useGetAxios(url)

  useEffect(() => {
    setUrl(`/api/watch_groups/?page=${page}&limit=${limit}`);
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
