'use client';

import { useEffect, useRef, useState } from 'react';

import { loadGoogleMaps } from '@/components/page/events/all-events/map/loadGoogleMaps';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from '@/utils/events-page';

import v from './VenueMap.module.scss';

const VENUE_ZOOM = 15;

interface VenueMapProps {
  latitude: number;
  longitude: number;
}

interface Drawn {
  map: google.maps.Map;
  marker: google.maps.marker.AdvancedMarkerElement;
}

/** A small Google map with one pin on the resolved venue. It shows nothing when the map cannot load. */
export function VenueMap({ latitude, longitude }: VenueMapProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const drawn = useRef<Drawn | null>(null);
  const [failed, setFailed] = useState(false);

  // The map is made once; another venue moves it and its pin.
  useEffect(() => {
    const position = { lat: latitude, lng: longitude };
    if (drawn.current) {
      drawn.current.map.setCenter(position);
      drawn.current.marker.position = position;
      return;
    }
    let live = true;
    loadGoogleMaps(GOOGLE_MAPS_API_KEY).then(
      (libs) => {
        if (!live || !canvasRef.current) return;
        const map = new libs.Map(canvasRef.current, {
          mapId: GOOGLE_MAPS_MAP_ID,
          center: position,
          zoom: VENUE_ZOOM,
          disableDefaultUI: true,
          gestureHandling: 'cooperative',
          clickableIcons: false,
        });
        drawn.current = { map, marker: new libs.AdvancedMarkerElement({ map, position }) };
      },
      () => {
        if (live) setFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, [latitude, longitude]);

  useEffect(
    () => () => {
      if (drawn.current) drawn.current.marker.map = null;
      drawn.current = null;
    },
    [],
  );

  if (failed) return null;
  return <div ref={canvasRef} className={v.map} role="region" aria-label="Map of the venue" data-testid="venue-map" />;
}
