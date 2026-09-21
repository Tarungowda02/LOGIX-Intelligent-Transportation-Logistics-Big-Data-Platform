import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Clock3,
  Gauge,
  Map,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Search,
  TrendingUp,
} from 'lucide-react'

type RouteData = {
  id: string
  route: string
  distance: string
  avgSpeed: string
  delay: string
  efficiency: number
  risk: 'Low' | 'Moderate' | 'High'
  trend: 'up' | 'down'
}

type BackendRoute = {
  route_id: string
  origin: string
  destination: string
  distance_km: number
  historical_delay_rate: number
  average_speed: number
  route_rating: number
}

function Routes() {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch('/api/routes')

        if (!response.ok) {
          throw new Error('Failed to fetch route data')
        }

        const responseData = await response.json()

        // Backend returns:
        // { count: 5, routes: [...] }
        const data: BackendRoute[] = responseData.routes

        const mappedRoutes: RouteData[] = data.map((route) => {
          /*
           * Route Efficiency Score
           * Based on:
           * - Route rating
           * - Average speed
           * - Historical delay rate
           */
          const efficiency = Math.round(
            Math.max(
              0,
              Math.min(
                100,
                route.route_rating * 20 -
                  route.historical_delay_rate * 0.5 +
                  route.average_speed * 0.2
              )
            )
          )

          let risk: 'Low' | 'Moderate' | 'High'

          if (route.historical_delay_rate > 20) {
            risk = 'High'
          } else if (route.historical_delay_rate >= 15) {
            risk = 'Moderate'
          } else {
            risk = 'Low'
          }

          const trend: 'up' | 'down' =
            route.historical_delay_rate >= 18 ? 'up' : 'down'

          return {
            id: route.route_id,
            route: `${route.origin} → ${route.destination}`,
            distance: `${route.distance_km} km`,
            avgSpeed: `${route.average_speed} km/h`,
            delay: `${route.historical_delay_rate}%`,
            efficiency,
            risk,
            trend,
          }
        })

        setRoutes(mappedRoutes)
      } catch (err) {
        console.error(err)
        setError('Unable to connect to LOGIX backend.')
      } finally {
        setLoading(false)
      }
    }

    fetchRoutes()
  }, [])

  const filteredRoutes = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()

    if (!query) {
      return routes
    }

    return routes.filter(
      (route) =>
        route.id.toLowerCase().includes(query) ||
        route.route.toLowerCase().includes(query)
    )
  }, [routes, searchTerm])

  /* =========================
     ROUTE CALCULATIONS
  ========================= */

  const activeRoutes = routes.length

  const networkEfficiency =
    routes.length > 0
      ? Math.round(
          routes.reduce((sum, route) => sum + route.efficiency, 0) /
            routes.length
        )
      : 0

  const averageDelay =
    routes.length > 0
      ? (
          routes.reduce(
            (sum, route) => sum + parseFloat(route.delay),
            0
          ) / routes.length
        ).toFixed(1)
      : '0'

  const highRiskRoutes = routes.filter(
    (route) => route.risk === 'High'
  ).length

  const lowRiskRoutes = routes.filter(
    (route) => route.risk === 'Low'
  ).length

  const moderateRiskRoutes = routes.filter(
    (route) => route.risk === 'Moderate'
  ).length

  const totalRoutes = routes.length

  const lowPercentage =
    totalRoutes > 0
      ? ((lowRiskRoutes / totalRoutes) * 100).toFixed(1)
      : '0'

  const moderatePercentage =
    totalRoutes > 0
      ? ((moderateRiskRoutes / totalRoutes) * 100).toFixed(1)
      : '0'

  const highPercentage =
    totalRoutes > 0
      ? ((highRiskRoutes / totalRoutes) * 100).toFixed(1)
      : '0'

  const travelEfficiency = Math.min(100, networkEfficiency + 2)

  const onTimePerformance = Math.max(
    0,
    Math.min(100, 100 - Number(averageDelay) * 0.5)
  )

  const routeReliability = Math.max(
    0,
    Math.min(100, networkEfficiency - 4)
  )

  const networkStatus =
    networkEfficiency >= 85
      ? 'Strong Network Performance'
      : networkEfficiency >= 70
      ? 'Stable Network Performance'
      : 'Network Needs Attention'

  const insightRoutes = routes.filter(
    (route) => route.risk === 'High'
  )

  const insightText =
    insightRoutes.length > 0
      ? `${insightRoutes
          .slice(0, 2)
          .map((route) => route.route)
          .join(
            ' and '
          )} are currently showing elevated delay patterns. Historical delay frequency is the primary risk contributor in the current route dataset.`
      : 'Current route performance is stable across the available transportation network. No high-risk corridors were detected.'

  return (
    <div className="page-container">

      {/* =========================
          HEADER
      ========================= */}

      <div className="page-heading">
        <div>
          <div className="breadcrumb">
            LOGIX <span>/</span> INTELLIGENCE <span>/</span> ROUTES
          </div>

          <h1>Route Intelligence</h1>

          <p>
            Analyze route efficiency, travel performance, delays and
            operational risk across the transportation network.
          </p>
        </div>

        <button className="primary-button">
          <Map size={17} />
          Explore Network
        </button>
      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '18px',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#dc2626',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* =========================
          ROUTE KPI
      ========================= */}

      <div className="route-summary">

        <div className="route-stat-card">
          <div className="route-stat-icon">
            <RouteIcon size={20} />
          </div>

          <div>
            <span>Active Routes</span>
            <strong>{loading ? '—' : activeRoutes}</strong>
            <small>Across the network</small>
          </div>
        </div>

        <div className="route-stat-card">
          <div className="route-stat-icon">
            <Gauge size={20} />
          </div>

          <div>
            <span>Network Efficiency</span>
            <strong>
              {loading ? '—' : `${networkEfficiency}%`}
            </strong>
            <small>Calculated from route performance</small>
          </div>
        </div>

        <div className="route-stat-card">
          <div className="route-stat-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Average Delay Rate</span>
            <strong>
              {loading ? '—' : `${averageDelay}%`}
            </strong>
            <small>Across available routes</small>
          </div>
        </div>

        <div className="route-stat-card">
          <div className="route-stat-icon">
            <AlertTriangle size={20} />
          </div>

          <div>
            <span>High Risk Routes</span>
            <strong>
              {loading ? '—' : highRiskRoutes}
            </strong>
            <small>Requires attention</small>
          </div>
        </div>

      </div>

      {/* =========================
          NETWORK OVERVIEW
      ========================= */}

      <div className="route-overview-grid">

        <div className="panel network-panel">

          <div className="panel-header">
            <div>
              <h2>Network Performance</h2>
              <p>
                Transportation network efficiency overview
              </p>
            </div>

            <TrendingUp size={21} />
          </div>

          <div className="network-content">

            <div className="network-score">

              <div className="network-score-ring">
                <strong>
                  {loading ? '—' : networkEfficiency}
                </strong>
                <span>/100</span>
              </div>

              <div>
                <span>ROUTE EFFICIENCY SCORE</span>

                <strong>
                  {networkStatus}
                </strong>

                <p>
                  {loading
                    ? 'Loading distributed route analytics...'
                    : 'Performance score calculated from route rating, speed and historical delay.'}
                </p>
              </div>

            </div>

            <div className="network-bars">

              <div>
                <span>Travel Efficiency</span>
                <strong>{travelEfficiency}%</strong>
              </div>

              <div className="network-bar">
                <div
                  style={{
                    width: `${travelEfficiency}%`,
                  }}
                />
              </div>

              <div>
                <span>On-Time Performance</span>
                <strong>
                  {Math.round(onTimePerformance)}%
                </strong>
              </div>

              <div className="network-bar">
                <div
                  style={{
                    width: `${onTimePerformance}%`,
                  }}
                />
              </div>

              <div>
                <span>Route Reliability</span>
                <strong>
                  {Math.round(routeReliability)}%
                </strong>
              </div>

              <div className="network-bar">
                <div
                  style={{
                    width: `${routeReliability}%`,
                  }}
                />
              </div>

            </div>

          </div>
        </div>

        {/* =========================
            RISK DISTRIBUTION
        ========================= */}

        <div className="panel route-risk-panel">

          <div className="panel-header">
            <div>
              <h2>Risk Distribution</h2>
              <p>Current route risk classification</p>
            </div>

            <AlertTriangle size={21} />
          </div>

          <div className="risk-distribution">

            <div className="risk-total">
              <strong>
                {loading ? '—' : totalRoutes}
              </strong>

              <span>Total Routes</span>
            </div>

            <div className="risk-distribution-list">

              <div>
                <span className="risk-marker low"></span>
                <span>Low Risk</span>
                <strong>{lowRiskRoutes}</strong>
                <small>{lowPercentage}%</small>
              </div>

              <div>
                <span className="risk-marker moderate"></span>
                <span>Moderate</span>
                <strong>{moderateRiskRoutes}</strong>
                <small>{moderatePercentage}%</small>
              </div>

              <div>
                <span className="risk-marker high"></span>
                <span>High Risk</span>
                <strong>{highRiskRoutes}</strong>
                <small>{highPercentage}%</small>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* =========================
          ROUTE TABLE
      ========================= */}

      <div className="panel routes-table-panel">

        <div className="routes-toolbar">

          <div>
            <h2>Route Performance</h2>
            <p>
              Distributed route analytics dataset
            </p>
          </div>

          <div className="routes-actions">

            <div className="routes-search">
              <Search size={16} />

              <input
                type="text"
                placeholder="Search route or location..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />
            </div>

            <button className="secondary-button small">
              <Navigation size={15} />
              Live Network
            </button>

          </div>

        </div>

        <div className="routes-table-wrapper">

          <table className="routes-table">

            <thead>
              <tr>
                <th>ROUTE</th>
                <th>DISTANCE</th>
                <th>AVG SPEED</th>
                <th>DELAY RATE</th>
                <th>EFFICIENCY</th>
                <th>RISK</th>
                <th>TREND</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: 'center',
                      padding: '30px',
                    }}
                  >
                    Loading route intelligence...
                  </td>
                </tr>

              ) : filteredRoutes.length === 0 ? (

                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: 'center',
                      padding: '30px',
                    }}
                  >
                    No routes found.
                  </td>
                </tr>

              ) : (

                filteredRoutes.map((route) => (

                  <tr key={route.id}>

                    <td>
                      <div className="route-table-name">

                        <div className="route-table-icon">
                          <MapPin size={15} />
                        </div>

                        <div>
                          <strong>
                            {route.route}
                          </strong>

                          <span>
                            {route.id}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>
                      {route.distance}
                    </td>

                    <td>
                      {route.avgSpeed}
                    </td>

                    <td>
                      {route.delay}
                    </td>

                    <td>

                      <div className="route-efficiency">

                        <div className="route-efficiency-bar">

                          <div
                            style={{
                              width: `${route.efficiency}%`,
                            }}
                          />

                        </div>

                        <strong>
                          {route.efficiency}%
                        </strong>

                      </div>

                    </td>

                    <td>

                      <span
                        className={`route-risk ${route.risk.toLowerCase()}`}
                      >
                        {route.risk}
                      </span>

                    </td>

                    <td>

                      <div
                        className={`route-trend ${route.trend}`}
                      >

                        {route.trend === 'up' ? (
                          <ArrowUp size={13} />
                        ) : (
                          <ArrowDown size={13} />
                        )}

                        {route.trend === 'up'
                          ? 'Increasing'
                          : 'Improving'}

                      </div>

                    </td>

                    <td>

                      <ChevronRight
                        size={16}
                        className="route-row-arrow"
                      />

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* =========================
          INTELLIGENCE INSIGHT
      ========================= */}

      <div className="route-insight">

        <div className="route-insight-icon">
          <AlertTriangle size={20} />
        </div>

        <div>

          <strong>
            Route Intelligence Insight
          </strong>

          <p>
            {loading
              ? 'Analyzing route data...'
              : insightText}
          </p>

        </div>

        <div className="route-insight-score">

          <span>NETWORK SCORE</span>

          <strong>
            {loading
              ? '—'
              : `${networkEfficiency} / 100`}
          </strong>

        </div>

      </div>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="dashboard-footer">

        <span>
          LOGIX Route Intelligence
        </span>

        <span>
          Route Analytics <b>•</b> Risk Analysis <b>•</b>{' '}
          Network Performance
        </span>

      </footer>

    </div>
  )
}

export default Routes