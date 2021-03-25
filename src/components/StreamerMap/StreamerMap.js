import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';

export default function StreamerMap(props) {
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
            {props.marker && <Marker position={{lat: props.marker[0], lng: props.marker[1]}}
                    interactive={false}
                />}
        </MapContainer>
    )
}

