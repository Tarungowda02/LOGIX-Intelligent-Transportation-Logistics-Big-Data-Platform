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
}

type BackendVehicle = {
  vehicle_id: string
  vehicle_type: string
  capacity_kg: number
  fuel_type: string
  mileage: number
  maintenance_status: string
  vehicle_age: number
}

type RiskItem = {
  route: string
  score: number
  reason: string
  level: 'High' | 'Moderate' | 'Low'
}

export default function RiskCenter() {
  const [routes, setRoutes] = useState<BackendRoute[]>([])
  const [vehicles, setVehicles] = useState<BackendVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setLoading(true)
        setError('')

        const [routesResponse, fleetResponse] =
          await Promise.all([
            fetch('https://estimate-participation-sleep-extraordinary.trycloudflare.com/api/routes'),
            fetch('https://estimate-participation-sleep-extraordinary.trycloudflare.com/api/fleet'),
          ])

        if (!routesResponse.ok || !fleetResponse.ok) {
          throw new Error('Failed to fetch risk data')
        }

        const routesResponseData = await routesResponse.json()
        const fleetResponseData = await fleetResponse.json()

        const routeData: BackendRoute[] = Array.isArray(
          routesResponseData
        )
          ? routesResponseData
          : routesResponseData.routes || []

        const vehicleData: BackendVehicle[] = Array.isArray(
          fleetResponseData
        )
          ? fleetResponseData
          : fleetResponseData.vehicles ||
            fleetResponseData.fleet ||
            []

        setRoutes(routeData)
        setVehicles(vehicleData)
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

  /* =========================
     HIGH RISK ROUTES
  ========================= */

  const highRiskRoutes = risks.filter(
    (risk) => risk.level === 'High'
  ).length

  /* =========================
     VEHICLE RISK
  ========================= */

  const vehiclesNeedingAttention = vehicles.filter(
    (vehicle) =>
      vehicle.maintenance_status
        .toLowerCase()
        .includes('service') ||
      vehicle.maintenance_status
        .toLowerCase()
        .includes('warning')
  ).length

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
            {loading ? '—' : routes.length}
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
                key={item.route}
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