import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Clock3,
  Database,
  Gauge,
  TrendingUp,
} from 'lucide-react'
import './Analytics.css'

type Shipment = {
  shipment_id: string
  vehicle_id: string
  origin: string
  destination: string
  distance_km: number
  weight_kg: number
  priority: string
  status: string
  delay_minutes: number
}

type Route = {
  route_id: string
  origin: string
  destination: string
  distance_km: number
  historical_delay_rate: number
  average_speed: number
  route_rating: number
}

type DashboardData = {
  total_shipments: number
  delivered: number
  delayed: number
  in_transit: number
  average_delay_minutes: number
  fleet_size: number
  routes: number
}

type AnalyticsRegion = {
  region: string
  volume: number
  onTime: number
  status: string
}

export default function Analytics() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        setError('')

        const [dashboardResponse, shipmentsResponse, routesResponse] =
          await Promise.all([
            fetch('https://estimate-participation-sleep-extraordinary.trycloudflare.com/api/dashboard'),
            fetch('https://estimate-participation-sleep-extraordinary.trycloudflare.com/api/shipments'),
            fetch('https://estimate-participation-sleep-extraordinary.trycloudflare.com/api/routes'),
          ])

        if (
          !dashboardResponse.ok ||
          !shipmentsResponse.ok ||
          !routesResponse.ok
        ) {
          throw new Error('Failed to fetch analytics data')
        }

        const dashboardData: DashboardData =
          await dashboardResponse.json()

        const shipmentResponseData =
          await shipmentsResponse.json()

        const routeResponseData =
          await routesResponse.json()

        /*
         * Backend responses may be wrapped:
         * { count: 5, shipments: [...] }
         * { count: 5, routes: [...] }
         */
        const shipmentData: Shipment[] = Array.isArray(
          shipmentResponseData
        )
          ? shipmentResponseData
          : shipmentResponseData.shipments || []

        const routeData: Route[] = Array.isArray(
          routeResponseData
        )
          ? routeResponseData
          : routeResponseData.routes || []

        setDashboard(dashboardData)
        setShipments(shipmentData)
        setRoutes(routeData)
      } catch (err) {
        console.error(err)
        setError('Unable to connect to LOGIX analytics backend.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  /* =========================
     NETWORK EFFICIENCY
  ========================= */

  const networkEfficiency = useMemo(() => {
    if (routes.length === 0) return 0

    const scores = routes.map((route) =>
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

    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) /
        scores.length
    )
  }, [routes])

  /* =========================
     AVERAGE DELIVERY TIME
  ========================= */

  const averageDeliveryTime = useMemo(() => {
    if (!dashboard) return 0

    /*
     * Current backend does not provide exact delivery timestamps.
     * We therefore expose average delay as the available
     * operational time metric.
     */
    return dashboard.average_delay_minutes
  }, [dashboard])

  /* =========================
     REGIONAL PERFORMANCE
  ========================= */

  const regionalData = useMemo<AnalyticsRegion[]>(() => {
    const regionMap: Record<
      string,
      { volume: number; onTime: number }
    > = {}

    const getRegion = (city: string) => {
      const normalized = city.toLowerCase()

      if (
        normalized.includes('bangalore') ||
        normalized.includes('chennai') ||
        normalized.includes('hyderabad')
      ) {
        return 'South'
      }

      if (
        normalized.includes('mumbai') ||
        normalized.includes('pune')
      ) {
        return 'West'
      }

      if (
        normalized.includes('delhi') ||
        normalized.includes('jaipur')
      ) {
        return 'North'
      }

      return 'Other'
    }

    shipments.forEach((shipment) => {
      const region = getRegion(shipment.origin)

      if (!regionMap[region]) {
        regionMap[region] = {
          volume: 0,
          onTime: 0,
        }
      }

      regionMap[region].volume += 1

      if (
        shipment.delay_minutes <= 0 ||
        shipment.status === 'Delivered'
      ) {
        regionMap[region].onTime += 1
      }
    })

    return Object.entries(regionMap)
      .map(([region, values]) => {
        const onTime =
          values.volume > 0
            ? Math.round(
                (values.onTime / values.volume) * 100
              )
            : 0

        let status = 'Needs Attention'

        if (onTime >= 95) {
          status = 'Excellent'
        } else if (onTime >= 90) {
          status = 'Good'
        } else if (onTime >= 80) {
          status = 'Moderate'
        }

        return {
          region,
          volume: values.volume,
          onTime,
          status,
        }
      })
      .sort((a, b) => b.volume - a.volume)
  }, [shipments])

  /* =========================
     LIVE TREND DATA
  ========================= */

  const trendData = useMemo(() => {
    return routes.map((route) => {
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

      return {
        month: route.route_id,
        efficiency,
      }
    })
  }, [routes])

  const highestRegion = useMemo(() => {
    if (regionalData.length === 0) return null

    return [...regionalData].sort(
      (a, b) => b.onTime - a.onTime
    )[0]
  }, [regionalData])

  const lowestRegion = useMemo(() => {
    if (regionalData.length === 0) return null

    return [...regionalData].sort(
      (a, b) => a.onTime - b.onTime
    )[0]
  }, [regionalData])

  return (
    <div className="analytics-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="module-header">

        <div>

          <div className="module-breadcrumb">
            LOGIX <span>/</span> ANALYTICS
          </div>

          <h1>Logistics Analytics</h1>

          <p>
            Distributed transportation data transformed into
            operational intelligence.
          </p>

        </div>

        <button className="module-primary-button">
          <BarChart3 size={17} />
          Generate Report
        </button>

      </header>

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
          ANALYTICS KPIs
      ========================= */}

      <section className="analytics-kpis">

        <div className="analytics-kpi">

          <div className="analytics-kpi-icon">
            <Database size={19} />
          </div>

          <span>Records Analyzed</span>

          <strong>
            {loading
              ? '—'
              : dashboard
              ? dashboard.total_shipments
              : 0}
          </strong>

          <small>
            Live logistics dataset
          </small>

        </div>

        <div className="analytics-kpi">

          <div className="analytics-kpi-icon">
            <TrendingUp size={19} />
          </div>

          <span>Network Growth</span>

          <strong>
            {loading
              ? '—'
              : `${dashboard?.in_transit || 0} Active`}
          </strong>

          <small>
            Shipments currently in transit
          </small>

        </div>

        <div className="analytics-kpi">

          <div className="analytics-kpi-icon">
            <Clock3 size={19} />
          </div>

          <span>Avg Delivery Delay</span>

          <strong>
            {loading
              ? '—'
              : `${averageDeliveryTime.toFixed(1)} min`}
          </strong>

          <small>
            From live shipment dataset
          </small>

        </div>

        <div className="analytics-kpi">

          <div className="analytics-kpi-icon">
            <Gauge size={19} />
          </div>

          <span>Network Efficiency</span>

          <strong>
            {loading
              ? '—'
              : `${networkEfficiency}/100`}
          </strong>

          <small>
            Calculated from route performance
          </small>

        </div>

      </section>

      {/* =========================
          ANALYTICS GRID
      ========================= */}

      <section className="analytics-grid">

        {/* =========================
            TREND PANEL
        ========================= */}

        <div className="analytics-panel analytics-trend-panel">

          <div className="analytics-panel-header">

            <div>

              <h2>
                Route Efficiency Trend
              </h2>

              <p>
                Live distributed route performance
              </p>

            </div>

          </div>

          <div className="trend-chart">

            {loading ? (

              <div
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '40px 0',
                }}
              >
                Loading analytics...
              </div>

            ) : trendData.length === 0 ? (

              <div
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '40px 0',
                }}
              >
                No route analytics available.
              </div>

            ) : (

              trendData.map((item) => (

                <div
                  className="trend-column"
                  key={item.month}
                >

                  <div className="trend-bar-wrap">

                    <div
                      className="trend-bar"
                      style={{
                        height: `${item.efficiency * 1.7}px`,
                      }}
                    />

                  </div>

                  <strong>
                    {item.efficiency}%
                  </strong>

                  <span>
                    {item.month}
                  </span>

                </div>

              ))

            )}

          </div>

        </div>

        {/* =========================
            REGIONAL PERFORMANCE
        ========================= */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">

            <div>

              <h2>
                Regional Performance
              </h2>

              <p>
                Shipment volume and delivery quality
              </p>

            </div>

          </div>

          <div className="regional-list">

            {loading ? (

              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 0',
                }}
              >
                Loading regional data...
              </div>

            ) : regionalData.length === 0 ? (

              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 0',
                }}
              >
                No regional data available.
              </div>

            ) : (

              regionalData.map((region) => (

                <div
                  className="regional-row"
                  key={region.region}
                >

                  <div>

                    <strong>
                      {region.region}
                    </strong>

                    <span>
                      {region.volume} shipments
                    </span>

                  </div>

                  <div className="regional-score">

                    <strong>
                      {region.onTime}%
                    </strong>

                    <span>
                      {region.status}
                    </span>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

      </section>

      {/* =========================
          ANALYTICS INSIGHT
      ========================= */}

      <section className="analytics-panel analytics-insights">

        <div className="insight-icon">
          <TrendingUp size={20} />
        </div>

        <div>

          <h2>
            Analytics Insight
          </h2>

          <p>
            {loading
              ? 'Analyzing distributed transportation data...'
              : highestRegion && lowestRegion
              ? `${highestRegion.region} currently leads regional delivery performance at ${highestRegion.onTime}%, while ${lowestRegion.region} presents the strongest opportunity for operational optimization at ${lowestRegion.onTime}%. Overall network efficiency is ${networkEfficiency}/100 based on live route performance.`
              : 'Current analytics data is insufficient to generate a regional performance insight.'}
          </p>

        </div>

      </section>

    </div>
  )
}
