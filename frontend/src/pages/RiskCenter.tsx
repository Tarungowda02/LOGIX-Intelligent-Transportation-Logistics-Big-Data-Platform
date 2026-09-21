import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Gauge,
  Route,
  ShieldAlert,
  Truck,
} from 'lucide-react'
import './RiskCenter.css'

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

type BackendVehicle = {
  vehicle_id: string
  vehicle_type: string
  capacity_kg: number
  fuel_type: string
  mileage: number
  maintenance_status: string
  vehicle_age: number
  performance_score: number
  performance_level: string
}

type RiskItem = {
  route_id: string
  route: string
  score: number
  reason: string
  level: 'High' | 'Moderate' | 'Low'
}

type RiskCenterProps = {
  onRouteSelect: (routeId: string) => void
}

export default function RiskCenter({
  onRouteSelect,
}: RiskCenterProps) {
  const [routes, setRoutes] = useState<BackendRoute[]>([])
  const [vehicles, setVehicles] = useState<BackendVehicle[]>([])
  const [hadoopOverview, setHadoopOverview] = useState<any>(null)
  const [selectedRoute, setSelectedRoute] = useState<BackendRoute | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setLoading(true)
        setError('')

        const [
          routesResponse,
          vehiclesResponse,
          overviewResponse,
        ] = await Promise.all([
          fetch('/api/hadoop/routes'),
          fetch('/api/hadoop/vehicles'),
          fetch('/api/hadoop/overview'),
        ])

        if (
          !routesResponse.ok ||
          !vehiclesResponse.ok ||
          !overviewResponse.ok
        ) {
          throw new Error('Failed to fetch Hadoop risk data')
        }

        const routesResponseData = await routesResponse.json()
        const vehiclesResponseData = await vehiclesResponse.json()
        const overviewResponseData = await overviewResponse.json()

        const routeData: BackendRoute[] =
          routesResponseData.routes || []

        const vehicleData: BackendVehicle[] =
          vehiclesResponseData.vehicles || []

        setRoutes(routeData)
        setVehicles(vehicleData)
        setHadoopOverview(overviewResponseData)
      } catch (err) {
        console.error(err)
        setError('Unable to connect to LOGIX risk engine.')
      } finally {
        setLoading(false)
      }
    }

    fetchRiskData()
  }, [])

  /* =========================
     ROUTE RISK CALCULATION
  ========================= */

  const calculateRouteRisk = (
    route: BackendRoute
  ): RiskItem => {
    /*
     * Logistics Risk Score
     *
     * Current factors:
     * - Historical delay rate
     * - Route rating
     * - Average speed
     * - Distance
     *
     * Score: 0–100
     */

    const delayFactor =
      route.historical_delay_rate * 2.2

    const ratingFactor =
      (5 - route.route_rating) * 8

    const speedFactor =
      Math.max(0, 65 - route.average_speed) * 0.8

    const distanceFactor =
      Math.max(0, route.distance_km - 400) * 0.015

    const score = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          delayFactor +
            ratingFactor +
            speedFactor +
            distanceFactor
        )
      )
    )

    let level: 'High' | 'Moderate' | 'Low'

    if (score >= 60) {
      level = 'High'
    } else if (score >= 30) {
      level = 'Moderate'
    } else {
      level = 'Low'
    }

    const contributors: string[] = []

    if (route.historical_delay_rate >= 15) {
      contributors.push('historical delays')
    }

    if (route.average_speed < 60) {
      contributors.push('lower average speed')
    }

    if (route.route_rating < 4) {
      contributors.push('route performance')
    }

    if (route.distance_km > 500) {
      contributors.push('long distance')
    }

    const reason =
      contributors.length > 0
        ? contributors.slice(0, 2).join(' + ')
        : 'Stable route performance'

    return {
      route_id: route.route_id,
      route: `${route.origin} → ${route.destination}`,
      score,
      reason,
      level,
    }
  }

  const risks = useMemo(() => {
    return routes
      .map(calculateRouteRisk)
      .sort((a, b) => b.score - a.score)
  }, [routes])

  /* =========================
     NETWORK RISK SCORE
  ========================= */

  const networkRiskScore = useMemo(() => {
    if (risks.length === 0) return 0

    return Math.round(
      risks.reduce((sum, risk) => sum + risk.score, 0) /
        risks.length
    )
  }, [risks])

  const networkRiskLevel =
    networkRiskScore >= 60
      ? 'HIGH'
      : networkRiskScore >= 30
      ? 'MODERATE'
      : 'LOW'

  // Hadoop intelligence summary
  const hadoopRouteCount =
    hadoopOverview?.routes?.total ?? routes.length

  /* =========================
     HIGH RISK ROUTES
  ========================= */

  const highRiskRoutes =
    hadoopOverview?.routes?.high_risk ?? 0

  /* =========================
     VEHICLE RISK
  ========================= */

  const vehiclesNeedingAttention =
  hadoopOverview?.vehicles?.poor ?? 0

  /* =========================
     RISK FACTORS
  ========================= */

  const trafficImpact = useMemo(() => {
    if (routes.length === 0) return 0

    const highDelayRoutes = routes.filter(
      (route) => route.historical_delay_rate >= 15
    ).length

    return Math.round(
      (highDelayRoutes / routes.length) * 100
    )
  }, [routes])

  const routeHistoryImpact = useMemo(() => {
    if (routes.length === 0) return 0

    const averageDelay =
      routes.reduce(
        (sum, route) =>
          sum + route.historical_delay_rate,
        0
      ) / routes.length

    return Math.round(
      Math.min(100, averageDelay * 2)
    )
  }, [routes])

  const vehicleReliabilityImpact = useMemo(() => {
    if (vehicles.length === 0) return 0

    const attentionVehicles =
      vehicles.filter(
        (vehicle) =>
          vehicle.maintenance_status
            .toLowerCase()
            .includes('service') ||
          vehicle.maintenance_status
            .toLowerCase()
            .includes('warning')
      ).length

    return Math.round(
      (attentionVehicles / vehicles.length) * 100
    )
  }, [vehicles])

  /* =========================
     EXPLAINABLE RISK MODEL
  ========================= */

  const shipmentDelayExposure =
    hadoopOverview?.shipments?.total
      ? (hadoopOverview.shipments.delayed /
          hadoopOverview.shipments.total) *
        100
      : 0

  const routeRiskExposure =
    hadoopOverview?.routes?.total
      ? (hadoopOverview.routes.high_risk /
          hadoopOverview.routes.total) *
        100
      : 0

  const fleetRiskExposure =
    hadoopOverview?.vehicles?.total
      ? (hadoopOverview.vehicles.poor /
          hadoopOverview.vehicles.total) *
        100
      : 0

  const historicalDelayImpact = Math.min(
    100,
    routeHistoryImpact
  )

  const riskContributionTotal =
    shipmentDelayExposure +
    routeRiskExposure +
    historicalDelayImpact +
    fleetRiskExposure

  const shipmentRiskContribution =
    riskContributionTotal > 0
      ? Math.round(
          (shipmentDelayExposure / riskContributionTotal) * 100
        )
      : 0

  const routeRiskContribution =
    riskContributionTotal > 0
      ? Math.round(
          (routeRiskExposure / riskContributionTotal) * 100
        )
      : 0

  const historicalRiskContribution =
    riskContributionTotal > 0
      ? Math.round(
          (historicalDelayImpact / riskContributionTotal) * 100
        )
      : 0

  const fleetRiskContribution =
    riskContributionTotal > 0
      ? 100 -
        shipmentRiskContribution -
        routeRiskContribution -
        historicalRiskContribution
      : 0

  const riskDescription =
    networkRiskScore >= 60
      ? 'Current network risk is elevated and requires immediate operational attention.'
      : networkRiskScore >= 30
      ? 'Current risk is manageable, with route performance and historical delays as the primary contributors.'
      : 'Current network risk is low, with most monitored corridors operating within acceptable performance levels.'

  return (
    <div className="risk-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="module-header">

        <div>

          <div className="module-breadcrumb">
            LOGIX <span>/</span> RISK CENTER
          </div>

          <h1>Logistics Risk Center</h1>

          <p>
            Explainable risk intelligence for routes,
            vehicles and shipments.
          </p>

        </div>

        <div className="risk-live">
          <span />
          {loading
            ? ' Risk Engine Loading'
            : ' Risk Engine Online'}
        </div>

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
            border:
              '1px solid rgba(239, 68, 68, 0.25)',
            background:
              'rgba(239, 68, 68, 0.08)',
            color: '#dc2626',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* =========================
          RISK OVERVIEW
      ========================= */}

      <section className="risk-overview">

        <div className="risk-hero-card">

          <div className="risk-hero-icon">
            <ShieldAlert size={22} />
          </div>

          <span>NETWORK RISK SCORE</span>

          <strong>
            {loading ? '—' : networkRiskScore}
            <span>/100</span>
          </strong>

          <b>
            {loading
              ? 'ANALYZING'
              : networkRiskLevel}
          </b>

          <p>
            {loading
              ? 'Analyzing live transportation risk factors.'
              : riskDescription}
          </p>

        </div>

        <div className="risk-stat-card">

          <div>
            <AlertTriangle size={19} />
          </div>

          <span>High Risk Routes</span>

          <strong>
            {loading ? '—' : highRiskRoutes}
          </strong>

          <small>
            Based on live route risk analysis
          </small>

        </div>

        <div className="risk-stat-card">

          <div>
            <Route size={19} />
          </div>

          <span>Routes Monitored</span>

          <strong>
            {loading ? '—' : hadoopRouteCount}
          </strong>

          <small>
            Live intelligence coverage
          </small>

        </div>

        <div className="risk-stat-card">

          <div>
            <Truck size={19} />
          </div>

          <span>Fleet Risk</span>

          <strong>
            {loading
              ? '—'
              : vehiclesNeedingAttention}
          </strong>

          <small>
            Vehicles need attention
          </small>

        </div>

      </section>
            {/* =========================
          HADOOP INTELLIGENCE
      ========================= */}
      <section className="hadoop-intelligence-panel">
        <div className="hadoop-intelligence-header">
          <div className="hadoop-intelligence-title">
            <div className="hadoop-intelligence-icon">
              <Gauge size={20} />
            </div>

            <div>
              <h2>LOGIX Intelligence Engine</h2>
              <p>Big-data operational intelligence powered by Hadoop MapReduce</p>
            </div>
          </div>

          <div className="hadoop-engine-status">
            <span />
            HADOOP ENGINE ONLINE
          </div>
        </div>

        <div className="hadoop-intelligence-stats">

          <div className="hadoop-intelligence-stat">
            <span>ROUTES ANALYZED</span>
            <strong>
              {loading
                ? '—'
                : hadoopOverview?.routes?.total?.toLocaleString() ?? '—'}
            </strong>
            <small>MapReduce route analysis</small>
          </div>

          <div className="hadoop-intelligence-stat hadoop-stat-danger">
            <span>HIGH-RISK ROUTES</span>
            <strong>
              {loading
                ? '—'
                : hadoopOverview?.routes?.high_risk?.toLocaleString() ?? '—'}
            </strong>
            <small>Requires attention</small>
          </div>

          <div className="hadoop-intelligence-stat">
            <span>SHIPMENTS PROCESSED</span>
            <strong>
              {loading
                ? '—'
                : hadoopOverview?.shipments?.total?.toLocaleString() ?? '—'}
            </strong>
            <small>Big-data records analyzed</small>
          </div>

          <div className="hadoop-intelligence-stat hadoop-stat-warning">
            <span>DELAYED SHIPMENTS</span>
            <strong>
              {loading
                ? '—'
                : hadoopOverview?.shipments?.delayed?.toLocaleString() ?? '—'}
            </strong>
            <small>Historical delay analysis</small>
          </div>

          <div className="hadoop-intelligence-stat hadoop-stat-success">
            <span>VEHICLES ANALYZED</span>
            <strong>
              {loading
                ? '—'
                : hadoopOverview?.vehicles?.total?.toLocaleString() ?? '—'}
            </strong>
            <small>Fleet performance analysis</small>
          </div>

        </div>

        <div className="hadoop-intelligence-footer">
          <span>
            Processing engine: <strong>Hadoop MapReduce</strong>
          </span>

          <span>
            Network on-time rate:{' '}
            <strong>
              {loading
                ? '—'
                : `${hadoopOverview?.shipments?.on_time_percentage ?? 0}%`}
            </strong>
          </span>
        </div>
      </section>

      {/* =========================
          EXPLAINABLE RISK ENGINE
      ========================= */}
      <section className="explainable-risk-panel">
        <div className="explainable-risk-header">
          <div className="explainable-risk-title">
            <div className="explainable-risk-icon">
              <ShieldAlert size={20} />
            </div>

            <div>
              <h2>Explainable Risk Engine</h2>
              <p>LOGIX explains the signals driving network exposure</p>
            </div>
          </div>

          <div className="explainable-risk-badge">
            AI RISK ANALYSIS
          </div>
        </div>

        <div className="explainable-risk-content">

          <div className="explainable-risk-score">
            <span className="explainable-risk-score-label">
              NETWORK RISK
            </span>

            <div className="explainable-risk-score-value">
              {loading ? '—' : networkRiskScore}
              <span>/100</span>
            </div>

            <p className="explainable-risk-score-description">
              {loading
                ? 'Analyzing network signals...'
                : 'Risk score generated from route performance, shipment delays and fleet intelligence.'}
            </p>
          </div>

          <div className="explainable-risk-factors">

            <div className="explainable-risk-factor">
              <span className="explainable-risk-factor-name">
                Shipment Delays
              </span>

              <div className="explainable-risk-bar">
                <div
                  className="explainable-risk-bar-fill"
                  style={{
                    width: `${shipmentRiskContribution}%`,
                  }}
                />
              </div>

              <span className="explainable-risk-factor-value">
                {loading ? '—' : `${shipmentRiskContribution}%`}
              </span>
            </div>

            <div className="explainable-risk-factor">
              <span className="explainable-risk-factor-name">
                High-Risk Routes
              </span>

              <div className="explainable-risk-bar">
                <div
                  className="explainable-risk-bar-fill"
                  style={{
                    width: `${routeRiskContribution}%`,
                  }}
                />
              </div>

              <span className="explainable-risk-factor-value">
                {loading ? '—' : `${routeRiskContribution}%`}
              </span>
            </div>

            <div className="explainable-risk-factor">
              <span className="explainable-risk-factor-name">
                Historical Delays
              </span>

              <div className="explainable-risk-bar">
                <div
                  className="explainable-risk-bar-fill"
                  style={{
                    width: `${historicalRiskContribution}%`,
                  }}
                />
              </div>

              <span className="explainable-risk-factor-value">
                {loading ? '—' : `${historicalRiskContribution}%`}
              </span>
            </div>

            <div className="explainable-risk-factor">
              <span className="explainable-risk-factor-name">
                Poor Fleet
              </span>

              <div className="explainable-risk-bar">
                <div
                  className="explainable-risk-bar-fill"
                  style={{
                    width: `${fleetRiskContribution}%`,
                  }}
                />
              </div>

              <span className="explainable-risk-factor-value">
                {loading ? '—' : `${fleetRiskContribution}%`}
              </span>
            </div>

          </div>
        </div>

        <div className="explainable-risk-signal">
          <strong>⚠ KEY SIGNAL</strong>

          <p>
            {loading
              ? 'Analyzing operational signals...'
              : `${hadoopOverview?.shipments?.delayed?.toLocaleString() ?? 0} of ${hadoopOverview?.shipments?.total?.toLocaleString() ?? 0} analyzed shipments experienced delays. Shipment delay exposure is currently one of the strongest network risk signals.`}
          </p>
        </div>

        <div className="explainable-risk-action">
          <strong>✓ LOGIX ACTION</strong>

          <p>
            Prioritize high-risk corridors and allocate higher-performing
            vehicles to delay-sensitive operations to reduce operational
            exposure.
          </p>
        </div>
      </section>

      {/* =========================
          RISK PRIORITIES
      ========================= */}

      <section className="risk-panel">

        <div className="risk-panel-header">

          <div>

            <h2>
              Risk Priorities
            </h2>

            <p>
              Highest-impact corridors requiring
              operational attention
            </p>

          </div>

          <button>
            View All
            <ArrowRight size={15} />
          </button>

        </div>

        <div className="risk-list">

          {loading ? (

            <div
              style={{
                padding: '30px',
                textAlign: 'center',
              }}
            >
              Analyzing route risks...
            </div>

          ) : risks.length === 0 ? (

            <div
              style={{
                padding: '30px',
                textAlign: 'center',
              }}
            >
              No route risk data available.
            </div>

          ) : (

            risks.slice(0, 5).map((item) => (

              <div
                className="risk-item"
                key={item.route_id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  console.log("🔥 RISK ROW CLICKED:", item.route_id, item.route)

                  const route = routes.find(
                    (candidate) => candidate.route_id === item.route_id
                  )

                  console.log("🔥 MATCHED ROUTE:", route)

                  if (route) {
                    onRouteSelect(route.route_id)
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()

                    const route = routes.find(
                      (candidate) => candidate.route_id === item.route_id
                    )

                    if (route) {
                      onRouteSelect(route.route_id)
                    }
                  }
                }}
              >

                <div
                  className={`risk-score risk-${item.level.toLowerCase()}`}
                >

                  <strong>
                    {item.score}
                  </strong>

                  <span>
                    /100
                  </span>

                </div>

                <div className="risk-route">

                  <strong>
                    {item.route}
                  </strong>

                  <span>
                    {item.reason}
                  </span>

                </div>

                <div
                  className={`risk-level risk-${item.level.toLowerCase()}`}
                >
                  {item.level}
                </div>

                <ArrowRight
                  size={17}
                  className="risk-arrow"
                />

              </div>

            ))

          )}

        </div>

      </section>

      {selectedRoute && (
        <section className="route-intelligence-panel">
          <div className="route-intelligence-header">
            <div>
              <span className="route-intelligence-eyebrow">
                LIVE HADOOP ROUTE ANALYSIS
              </span>

              <h2>Route Intelligence</h2>

              <p>
                {selectedRoute.route_id} · {selectedRoute.origin} →{' '}
                {selectedRoute.destination}
              </p>
            </div>

            <button
              type="button"
              className="route-intelligence-close"
              onClick={() => setSelectedRoute(null)}
            >
              ×
            </button>
          </div>

          <div className="route-intelligence-grid">
            <div className="route-intelligence-card">
              <span>Distance</span>
              <strong>{selectedRoute.distance_km.toFixed(1)} km</strong>
            </div>

            <div className="route-intelligence-card">
              <span>Average Speed</span>
              <strong>{selectedRoute.average_speed.toFixed(1)} km/h</strong>
            </div>

            <div className="route-intelligence-card">
              <span>Route Rating</span>
              <strong>{selectedRoute.route_rating.toFixed(1)} / 5</strong>
            </div>

            <div className="route-intelligence-card">
              <span>Efficiency Score</span>
              <strong>{selectedRoute.efficiency_score.toFixed(1)} / 100</strong>
            </div>

            <div className="route-intelligence-card">
              <span>Historical Delay</span>
              <strong>{selectedRoute.historical_delay_rate.toFixed(1)}%</strong>
            </div>

            <div className="route-intelligence-card">
              <span>Risk Level</span>
              <strong>{selectedRoute.risk_level}</strong>
            </div>
          </div>

          <div className="route-intelligence-bottom">
            <div className="route-intelligence-performance">
              <div className="route-intelligence-section-title">
                Route Performance
              </div>

              <div className="route-intelligence-status">
                <span>Origin</span>
                <strong>{selectedRoute.origin}</strong>
              </div>

              <div className="route-intelligence-status">
                <span>Destination</span>
                <strong>{selectedRoute.destination}</strong>
              </div>

              <div className="route-intelligence-status">
                <span>Efficiency Level</span>
                <strong>{selectedRoute.efficiency_level}</strong>
              </div>
            </div>

            <div className="route-intelligence-performance">
              <div className="route-intelligence-section-title">
                Hadoop Analysis
              </div>

              <div className="route-intelligence-status">
                <span>Route ID</span>
                <strong>{selectedRoute.route_id}</strong>
              </div>

              <div className="route-intelligence-status">
                <span>Risk Classification</span>
                <strong>{selectedRoute.risk_level}</strong>
              </div>

              <div className="route-intelligence-status">
                <span>Historical Delay</span>
                <strong>{selectedRoute.historical_delay_rate.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================
          RISK FACTORS
      ========================= */}

      <section className="risk-factors">

        <div className="risk-factor-card">

          <Gauge size={20} />

          <div>
            <strong>
              Traffic Impact
            </strong>

            <span>
              {loading
                ? '—'
                : `${trafficImpact}%`}
            </span>
          </div>

          <p>
            Historical delay patterns indicate
            potential congestion impact.
          </p>

        </div>

        <div className="risk-factor-card">

          <Route size={20} />

          <div>
            <strong>
              Route History
            </strong>

            <span>
              {loading
                ? '—'
                : `${routeHistoryImpact}%`}
            </span>
          </div>

          <p>
            Historical delivery performance
            influences corridor risk.
          </p>

        </div>

        <div className="risk-factor-card">

          <Truck size={20} />

          <div>
            <strong>
              Vehicle Reliability
            </strong>

            <span>
              {loading
                ? '—'
                : `${vehicleReliabilityImpact}%`}
            </span>
          </div>

          <p>
            Fleet maintenance condition contributes
            to operational risk.
          </p>

        </div>

      </section>

    </div>
  )
}