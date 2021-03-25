import React, { useState } from 'react'
import { MapContainer, TileLayer, useMapEvent, Marker} from 'react-leaflet'

export default function StreamerMap(props) {
    const [selectedPosition, setSelectedPosition] = useState(null);

    const Markers = () => {
        const map = useMapEvent('click', (e) => {
            setSelectedPosition([e.latlng.lat, e.latlng.lng]);
            props.onSelectedLatLngChange(e.latlng);
        });


        return (
            selectedPosition ?
                <Marker position={selectedPosition}
                    interactive={false}
                />
                : null
        )
    }

    return (
        <MapContainer style={{ height: '100%' }}
            center={[0, 0]}
            zoom={1}
            worldCopyJump={true}
            maxBounds={[[-90, -180], [90, 180]]}
            maxBoundsViscosity={0.9}>
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Markers />
        </MapContainer>
    )
}

