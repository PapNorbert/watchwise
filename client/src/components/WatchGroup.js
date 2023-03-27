import React from 'react'

export default function WatchGroup({watch_group}) {

  return (
    <div className='watch_group' key={watch_group.ID}>
      <p>{watch_group.Title}</p>
    </div>
  )
}
