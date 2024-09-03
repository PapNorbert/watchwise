import React from 'react'
import { Rating } from 'react-simple-star-rating'

import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertBasedOnRatingsToLanguage } from '../i18n/conversion'


export default function Ratings({handleRating}) {
  const { i18nData, language } = useLanguage();
  const { auth } = useAuth();

  const initialRatingMock = 4
  const avgRatingMock = 4.89;
  const nrOfRatingsMock = 5326;

  return (
    <>
      {auth.logged_in &&
        <div className='d-flex justify-content-center your-rating mt-1'>
          <span className='mt-1 fw-bold'>{convertKeyToSelectedLanguage('your_rating', i18nData)}: </span>
          <span className='ms-1'>
            <Rating onClick={handleRating} initialValue={initialRatingMock} allowFraction transition />
          </span>
        </div>
      }
      <div className='d-flex justify-content-center watchwise-rating mt-2'>
        <span className='fw-bold'>{convertKeyToSelectedLanguage('ww_rating', i18nData)}: </span>
        <span className='ms-2'>{avgRatingMock} / 5</span>
      </div>
      <div className='d-flex justify-content-center watchwise-rating'>
        <span>{convertBasedOnRatingsToLanguage(language, nrOfRatingsMock, i18nData)}</span>
      </div>
    </>
  )
}
