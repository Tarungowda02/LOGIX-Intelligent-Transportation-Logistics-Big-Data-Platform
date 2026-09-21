import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  Clock3,
  Gauge,
  Navigation,
  Route as RouteIcon,
  ShieldAlert,
  Truck,
  Zap,
} from 'lucide-react'

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import './RouteIntelligence.css'

type BackendRoute = {
  route_id: string
  origin: string
  destination: string
  distance_km: number
  historical_delay_rate: number
  average_speed: number
  route_rating: number
  efficiency_score: number
  efficiency_level: string
  risk_level: string
}

type BackendShipment = {
  route_id: string
  shipments: number
  delayed: number
  avg_delay: number
  max_delay: number
  on_time_pct: number
}

type Coordinates = {
  lat: number
  lon: number
}

type Props = {
  routeId: string
  onBack: () => void
}

type OsrmRoute = {
  geometry?: {
    coordinates?: [number, number][]
  }
  distance?: number
  duration?: number
}

const CITY_COORDINATES: Record<string, Coordinates> = {
  kochi: { lat: 9.9312, lon: 76.2673 },
  ernakulam: { lat: 9.9816, lon: 76.2999 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  bombay: { lat: 19.076, lon: 72.8777 },

  visakhapatnam: { lat: 17.6868, lon: 83.2185 },
  vizag: { lat: 17.6868, lon: 83.2185 },

  gurgaon: { lat: 28.4595, lon: 77.0266 },
  gurugram: { lat: 28.4595, lon: 77.0266 },
  delhi: { lat: 28.6139, lon: 77.209 },
  newdelhi: { lat: 28.6139, lon: 77.209 },

  bengaluru: { lat: 12.9716, lon: 77.5946 },
  bangalore: { lat: 12.9716, lon: 77.5946 },

  chennai: { lat: 13.0827, lon: 80.2707 },
  hyderabad: { lat: 17.385, lon: 78.4867 },
  pune: { lat: 18.5204, lon: 73.8567 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  surat: { lat: 21.1702, lon: 72.8311 },
  nagpur: { lat: 21.1458, lon: 79.0882 },
  indore: { lat: 22.7196, lon: 75.8577 },
  bhopal: { lat: 23.2599, lon: 77.4126 },
  patna: { lat: 25.5941, lon: 85.1376 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  lucknow: { lat: 26.8467, lon: 80.9462 },
  coimbatore: { lat: 11.0168, lon: 76.9558 },
  mysore: { lat: 12.2958, lon: 76.6394 },
  mangalore: { lat: 12.9141, lon: 74.856 },
  madurai: { lat: 9.9252, lon: 78.1198 },
  goa: { lat: 15.4909, lon: 73.8278 },
  vijayawada: { lat: 16.5062, lon: 80.648 },
  nashik: { lat: 19.9975, lon: 73.7898 },
  vadodara: { lat: 22.3072, lon: 73.1812 },
  rajkot: { lat: 22.3039, lon: 70.8022 },
}

function normalizeCity(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .trim()
}

function getCityCoordinates(city: string) {
  return CITY_COORDINATES[normalizeCity(city)]
}

function createTruckIcon() {
  return L.divIcon({
    className: 'logix-truck-icon-wrapper',
    html: `
      <div class="logix-truck-marker">
        <div class="truck-marker-pulse"></div>
        <svg
          class="truck-svg"
          viewBox="0 0 64 40"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="3" y="8" width="37" height="23" rx="3"
            fill="#ffffff"
            stroke="#0b1b2f"
            stroke-width="2"/>
          <path
            d="M40 15h10l9 9v7H40z"
            fill="#ffffff"
            stroke="#0b1b2f"
            stroke-width="2"
            stroke-linejoin="round"/>
          <rect x="45" y="18" width="7" height="6" rx="1"
            fill="#7ec8ff"/>
          <circle cx="15" cy="33" r="5"
            fill="#07111e"
            stroke="#ffffff"
            stroke-width="2"/>
          <circle cx="49" cy="33" r="5"
            fill="#07111e"
            stroke="#ffffff"
            stroke-width="2"/>
          <rect x="8" y="13" width="25" height="3" rx="1.5"
            fill="#3987ff"/>
        </svg>
      </div>
    `,
    iconSize: [54, 54],
    iconAnchor: [27, 27],
    popupAnchor: [0, -27],
  })
}

function createCityIcon(kind: 'origin' | 'destination') {
  const color = kind === 'origin' ? '#28d980' : '#ff5361'

  return L.divIcon({
    className: 'logix-city-icon-wrapper',
    html: `
      <div class="logix-city-marker ${kind}">
        <span
          class="city-marker-dot"
          style="--marker-color:${color}"
        ></span>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

function MapViewport({
  routeGeometry,
}: {
  routeGeometry: [number, number][]
}) {
  const map = useMap()

  useEffect(() => {
    if (routeGeometry.length < 2) return

    const bounds = L.latLngBounds(routeGeometry)

    map.fitBounds(bounds, {
      paddingTopLeft: [45, 55],
      paddingBottomRight: [45, 55],
      maxZoom: 7,
      animate: true,
      duration: 0.8,
    })
  }, [map, routeGeometry])

  return null
}

export default function RouteIntelligence({
  routeId,
  onBack,
}: Props) {
  const [route, setRoute] = useState<BackendRoute | null>(null)
  const [shipment, setShipment] =
    useState<BackendShipment | null>(null)

  const [routeGeometry, setRouteGeometry] =
    useState<[number, number][]>([])

  const [roadDistanceKm, setRoadDistanceKm] =
    useState(0)

  const [routeDurationMinutes, setRouteDurationMinutes] =
    useState(0)

  const [loading, setLoading] = useState(true)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapError, setMapError] = useState('')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const loadRoute = async () => {
      try {
        setLoading(true)

        const [routeResponse, shipmentResponse] =
          await Promise.all([
            fetch('/api/hadoop/routes'),
            fetch('/api/hadoop/shipments'),
          ])

        const routeData = await routeResponse.json()
        const shipmentData = await shipmentResponse.json()

        const selectedRoute =
          (routeData.routes || []).find(
            (item: BackendRoute) =>
              item.route_id === routeId
          ) || null

        const selectedShipment =
          (shipmentData.shipments || []).find(
            (item: BackendShipment) =>
              item.route_id === routeId
          ) || null

        setRoute(selectedRoute)
        setShipment(selectedShipment)
      } catch (error) {
        console.error(
          'Route Intelligence error:',
          error
        )
      } finally {
        setLoading(false)
      }
    }

    loadRoute()
  }, [routeId])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!route) return

    const origin = getCityCoordinates(route.origin)
    const destination = getCityCoordinates(route.destination)

    if (!origin || !destination) {
      setMapError(
        `Coordinates unavailable for ${route.origin} → ${route.destination}`
      )
      setMapLoading(false)
      return
    }

    const loadRoadRoute = async () => {
      try {
        setMapLoading(true)
        setMapError('')

        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${origin.lon},${origin.lat};` +
          `${destination.lon},${destination.lat}` +
          `?overview=full&geometries=geojson`

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Routing service unavailable')
        }

        const data = await response.json()

        const osrmRoute: OsrmRoute =
          data.routes?.[0]

        const coordinates =
          osrmRoute?.geometry?.coordinates

        if (!coordinates?.length) {
          throw new Error('No road geometry returned')
        }

        const geometry: [number, number][] =
          coordinates.map(
            ([lon, lat]) => [lat, lon]
          )

        setRouteGeometry(geometry)

        setRoadDistanceKm(
          (osrmRoute.distance || 0) / 1000
        )

        setRouteDurationMinutes(
          (osrmRoute.duration || 0) / 60
        )
      } catch (error) {
        console.warn(
          'OSRM route unavailable, using direct geographic fallback.',
          error
        )

        setMapError(
          'Road routing unavailable — geographic fallback active.'
        )

        setRouteGeometry([
          [origin.lat, origin.lon],
          [destination.lat, destination.lon],
        ])

        setRoadDistanceKm(route.distance_km)
        setRouteDurationMinutes(
          (route.distance_km /
            Math.max(route.average_speed, 1)) *
            60
        )
      } finally {
        setMapLoading(false)
      }
    }

    loadRoadRoute()
  }, [route])

  const progress = useMemo(() => {
    if (!routeGeometry.length) return 0

    return 12 + ((elapsed * 0.18) % 76)
  }, [elapsed, routeGeometry.length])

  const currentPosition = useMemo(() => {
    if (!routeGeometry.length) return null

    const index = Math.min(
      routeGeometry.length - 1,
      Math.floor(
        (progress / 100) *
          (routeGeometry.length - 1)
      )
    )

    return routeGeometry[index]
  }, [progress, routeGeometry])

  const currentSpeed = route
    ? Math.max(
        24,
        Math.min(
          82,
          route.average_speed +
            Math.sin(elapsed / 8) * 5
        )
      )
    : 0

  const estimatedDelay = route
    ? Math.max(
        0,
        Math.round(
          route.historical_delay_rate * 0.55 +
            Math.sin(elapsed / 9) * 3
        )
      )
    : 0

  const remainingDistance = Math.max(
    0,
    roadDistanceKm * (1 - progress / 100)
  )

  const etaMinutes = Math.round(
    Math.max(
      15,
      (remainingDistance /
        Math.max(currentSpeed, 1)) *
        60
    )
  )

  const travelledGeometry = useMemo(() => {
    if (!routeGeometry.length) return []

    const index = Math.min(
      routeGeometry.length - 1,
      Math.floor(
        (progress / 100) *
          (routeGeometry.length - 1)
      )
    )

    return routeGeometry.slice(0, index + 1)
  }, [progress, routeGeometry])

  if (loading) {
    return (
      <div className="route-intelligence-page">
        <div className="route-loading">
          <Activity size={24} />
          <strong>
            Loading Route Intelligence...
          </strong>
          <span>
            Connecting to Hadoop analytics engine
          </span>
        </div>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="route-intelligence-page">
        <button
          className="route-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back to Risk Center
        </button>

        <div className="route-error">
          Route data could not be found.
        </div>
      </div>
    )
  }

  const origin =
    getCityCoordinates(route.origin)

  const destination =
    getCityCoordinates(route.destination)

  return (
    <div className="route-intelligence-page">
      <header className="route-command-header">
        <div>
          <button
            className="route-back-button"
            onClick={onBack}
          >
            <ArrowLeft size={17} />
            Back to Risk Center
          </button>

          <div className="route-breadcrumb">
            LOGIX / ROUTE INTELLIGENCE /{' '}
            {route.route_id}
          </div>

          <h1>
            {route.origin}
            <span> → </span>
            {route.destination}
          </h1>

          <p>
            Live corridor monitoring ·{' '}
            <strong>{route.route_id}</strong>
          </p>
        </div>

        <div className="route-live-status">
          <span className="live-dot" />

          <div>
            <strong>
              GPS TRACKING ACTIVE
            </strong>

            <small>
              SIMULATED TELEMATICS FEED
            </small>
          </div>
        </div>
      </header>

      <section className="tracking-command-card">
        <div className="tracking-map">
          <MapContainer
            className="logix-leaflet-map"
            center={
              origin
                ? [origin.lat, origin.lon]
                : [20.5937, 78.9629]
            }
            zoom={6}
            scrollWheelZoom
            zoomControl
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
              maxZoom={19}
            />

            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri"
              maxZoom={19}
              opacity={0.9}
            />

            {routeGeometry.length > 1 && (
              <>
                <Polyline
                  positions={routeGeometry}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 8,
                    opacity: 0.75,
                  }}
                />

                <Polyline
                  positions={routeGeometry}
                  pathOptions={{
                    color: '#2583ff',
                    weight: 5,
                    opacity: 1,
                  }}
                />

                {travelledGeometry.length > 1 && (
                  <Polyline
                    positions={travelledGeometry}
                    pathOptions={{
                      color: '#39e0ff',
                      weight: 6,
                      opacity: 1,
                    }}
                  />
                )}
              </>
            )}

            {origin && (
              <Marker
                position={[
                  origin.lat,
                  origin.lon,
                ]}
                icon={createCityIcon('origin')}
              >
                <Popup>
                  <strong>
                    {route.origin}
                  </strong>
                  <br />
                  Origin
                </Popup>
              </Marker>
            )}

            {destination && (
              <Marker
                position={[
                  destination.lat,
                  destination.lon,
                ]}
                icon={createCityIcon(
                  'destination'
                )}
              >
                <Popup>
                  <strong>
                    {route.destination}
                  </strong>
                  <br />
                  Destination
                </Popup>
              </Marker>
            )}

            {currentPosition && (
              <Marker
                position={currentPosition}
                icon={createTruckIcon()}
                zIndexOffset={1000}
              >
                <Popup>
                  <div className="truck-popup">
                    <strong>
                      LOGIX VEHICLE
                    </strong>
                    <span>
                      SIM-GPS-01
                    </span>
                    <span>
                      Speed: {currentSpeed.toFixed(1)} km/h
                    </span>
                    <span>
                      Progress: {progress.toFixed(1)}%
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}

            {routeGeometry.length > 1 && (
              <MapViewport
                routeGeometry={routeGeometry}
              />
            )}
          </MapContainer>

          <div className="satellite-badge">
            <span className="satellite-dot" />
            SATELLITE VIEW
          </div>

          <div className="gps-map-status">
            <Navigation size={15} />
            <span>
              GPS POSITION UPDATING
            </span>
            <strong>
              #
              {elapsed
                .toString()
                .padStart(4, '0')}
            </strong>
          </div>

          {mapLoading && (
            <div className="map-loading-overlay">
              <Activity size={18} />
              <span>
                Building road route...
              </span>
            </div>
          )}

          {!mapLoading && mapError && (
            <div className="map-warning">
              {mapError}
            </div>
          )}
        </div>

        <aside className="tracking-sidebar">
          <div className="tracking-sidebar-title">
            <span>LIVE VEHICLE</span>
            <Truck size={20} />
          </div>

          <div className="vehicle-live-card">
            <div className="vehicle-live-icon">
              <Truck size={27} />
            </div>

            <div>
              <strong>
                SIM-GPS-01
              </strong>
              <span>
                Heavy Transport Unit
              </span>
            </div>
          </div>

          <div className="tracking-stat">
            <span>
              Current Speed
            </span>

            <strong>
              {currentSpeed.toFixed(1)} km/h
            </strong>
          </div>

          <div className="tracking-stat">
            <span>
              Journey Progress
            </span>

            <strong>
              {progress.toFixed(1)}%
            </strong>
          </div>

          <div className="tracking-stat">
            <span>
              Remaining Distance
            </span>

            <strong>
              {remainingDistance.toFixed(0)} km
            </strong>
          </div>

          <div className="tracking-stat">
            <span>
              Estimated Delay
            </span>

            <strong className="warning-value">
              +{estimatedDelay} min
            </strong>
          </div>

          <div className="tracking-stat">
            <span>ETA</span>

            <strong>
              {Math.floor(
                etaMinutes / 60
              )}
              h {etaMinutes % 60}m
            </strong>
          </div>

          <div className="gps-connected">
            <span />
            GPS SIGNAL STABLE
          </div>
        </aside>
      </section>

      <section className="route-kpi-grid">
        <div className="route-kpi">
          <RouteIcon size={19} />
          <span>
            Road Distance
          </span>
          <strong>
            {(
              roadDistanceKm ||
              route.distance_km
            ).toFixed(1)} km
          </strong>
        </div>

        <div className="route-kpi">
          <Gauge size={19} />
          <span>Efficiency</span>
          <strong>
            {route.efficiency_score.toFixed(
              1
            )}
          </strong>
        </div>

        <div className="route-kpi">
          <Clock3 size={19} />
          <span>
            Historical Delay
          </span>
          <strong>
            {route.historical_delay_rate.toFixed(
              1
            )}
            %
          </strong>
        </div>

        <div className="route-kpi">
          <ShieldAlert size={19} />
          <span>Risk Level</span>
          <strong className="risk-high">
            {route.risk_level}
          </strong>
        </div>
      </section>

      <section className="route-analysis-grid">
        <div className="route-analysis-card">
          <div className="analysis-card-header">
            <div>
              <span>
                ROUTE PERFORMANCE
              </span>
              <h2>
                Corridor Analysis
              </h2>
            </div>

            <Gauge size={21} />
          </div>

          <div className="analysis-row">
            <span>
              Average Speed
            </span>

            <strong>
              {route.average_speed.toFixed(
                1
              )}{' '}
              km/h
            </strong>
          </div>

          <div className="analysis-row">
            <span>
              Route Rating
            </span>

            <strong>
              {route.route_rating.toFixed(
                1
              )}{' '}
              / 5
            </strong>
          </div>

          <div className="analysis-row">
            <span>
              Routing Engine
            </span>

            <strong>
              OSRM / OSM
            </strong>
          </div>

          <div className="analysis-row">
            <span>
              Route Duration
            </span>

            <strong>
              {routeDurationMinutes
                ? `${Math.floor(
                    routeDurationMinutes /
                      60
                  )}h ${Math.round(
                    routeDurationMinutes %
                      60
                  )}m`
                : 'Calculating'}
            </strong>
          </div>

          <div className="analysis-row">
            <span>
              Efficiency Level
            </span>

            <strong>
              {route.efficiency_level}
            </strong>
          </div>
        </div>

        <div className="route-analysis-card">
          <div className="analysis-card-header">
            <div>
              <span>
                SHIPMENT INTELLIGENCE
              </span>

              <h2>
                Route Exposure
              </h2>
            </div>

            <Zap size={21} />
          </div>

          {shipment ? (
            <>
              <div className="analysis-row">
                <span>
                  Total Shipments
                </span>

                <strong>
                  {shipment.shipments.toLocaleString()}
                </strong>
              </div>

              <div className="analysis-row">
                <span>
                  Delayed Shipments
                </span>

                <strong className="risk-high">
                  {shipment.delayed.toLocaleString()}
                </strong>
              </div>

              <div className="analysis-row">
                <span>
                  Average Delay
                </span>

                <strong>
                  {shipment.avg_delay.toFixed(
                    1
                  )}{' '}
                  min
                </strong>
              </div>

              <div className="analysis-row">
                <span>
                  Maximum Delay
                </span>

                <strong>
                  {shipment.max_delay.toFixed(
                    0
                  )}{' '}
                  min
                </strong>
              </div>

              <div className="analysis-row">
                <span>
                  On-Time Rate
                </span>

                <strong>
                  {shipment.on_time_pct.toFixed(
                    2
                  )}
                  %
                </strong>
              </div>
            </>
          ) : (
            <div className="no-shipment-data">
              No shipment analytics available
              for this corridor.
            </div>
          )}
        </div>
      </section>

      <div className="route-intelligence-footer">
        <span>
          <Activity size={14} />
          Hadoop MapReduce analytics connected
        </span>

        <span>
          Satellite imagery · OSRM road geometry ·
          Simulated telematics
        </span>
      </div>
    </div>
  )
}
