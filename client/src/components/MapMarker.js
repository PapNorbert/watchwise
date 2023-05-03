import React, { useEffect } from 'react'
import { Marker, Popup, useMapEvents, useMap } from 'react-leaflet'


import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'

export default function MapMarker({ markerPosition, editEnabled, setLocation }) {
  const { i18nData } = useLanguage();
  const map = useMap();

  useEffect(() => {
    if (editEnabled) {
      map.flyTo(markerPosition);
      setLocation(markerPosition);
    }
  }, [map, markerPosition, editEnabled, setLocation])

  useMapEvents({
    click(e) {
      if (editEnabled) {
        console.log(e.latlng.lat,
          e.latlng.lng)
          setLocation(
          [
            e.latlng.lat,
            e.latlng.lng
          ]);
      }
    },
  })

  return (markerPosition &&
    <Marker position={markerPosition}>
      <Popup>
        {editEnabled?
         convertKeyToSelectedLanguage('current_loc', i18nData)
         :
         convertKeyToSelectedLanguage('event_loc', i18nData)
        }
      </Popup>
    </Marker>
  )
}
