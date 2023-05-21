import React from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'

import MapMarker from './MapMarker'

export default function Map({ editEnabled = false, middlePosition, setLocation = (_) => {} }) {

  return (
    <div className="map" id="map" >
      <MapContainer center={middlePosition} zoom={13} className='mb-3' >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapMarker markerPosition={middlePosition} editEnabled={editEnabled}
        setLocation={setLocation} />
      </MapContainer>
    </div>
  )
}
