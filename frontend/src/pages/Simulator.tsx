import { useState } from 'react'
import { Gauge, RotateCcw, Route, Truck, Zap } from 'lucide-react'
import './Simulator.css'

type SimulationResponse = {
  risk_score: number
  estimated_delay_minutes: number
  efficiency_score: number
  recommendation?: string
}

export default function Simulator() {
  const [traffic, setTraffic] = useState(40)
  const [dispatch, setDispatch] = useState(8)
  const [vehicleEfficiency, setVehicleEfficiency] = useState(82)

  const [result, setResult] =
    useState<SimulationResponse | null>(null)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  /*
   * Run simulation through FastAPI
   */
  const runSimulation = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        '/api/simulator',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            traffic,
            dispatch,
            vehicle_efficiency: vehicleEfficiency,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Simulation failed')
      }

      const data: SimulationResponse =
        await response.json()

      setResult(data)
    } catch (err) {
      console.error(err)

      setError(
        'Unable to connect to LOGIX simulation engine.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * Automatically calculate a local preview
   * while the backend result is not available.
   */
  const localRisk = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        22 +
          traffic * 0.42 +
          Math.max(0, dispatch - 8) * 2 -
          (vehicleEfficiency - 70) * 0.35
      )
    )
  )

  const localDelay = Math.max(
    4,
    Math.round(
      9 +
        traffic * 0.28 +
        Math.max(0, dispatch - 8) * 3
    )
  )

  const localEfficiency = Math.min(
    99,
    Math.max(
      50,
      Math.round(
        72 +
          vehicleEfficiency * 0.18 -
          traffic * 0.12
      )
    )
  )

  const risk =
    result?.risk_score ?? localRisk

  const delay =
    result?.estimated_delay_minutes ??
    localDelay

  const efficiency =
    result?.efficiency_score ??
    localEfficiency

  const riskLevel =
    risk > 60
      ? 'HIGH'
      : risk > 30
      ? 'MODERATE'
      : 'LOW'

  const reset = () => {
    setTraffic(40)
    setDispatch(8)
    setVehicleEfficiency(82)

    setResult(null)
    setError('')
  }

  return (
    <div className="simulator-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="module-header">

        <div>

          <div className="module-breadcrumb">
            LOGIX <span>/</span> SIMULATOR
          </div>

          <h1>
            What-If Logistics Simulator
          </h1>

          <p>
            Change operational conditions and
            instantly evaluate their impact.
          </p>

        </div>

        <button
          className="sim-reset"
          onClick={reset}
        >
          <RotateCcw size={16} />
          Reset Scenario
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
            borderRadius: '8px',
            background: '#fff1f1',
            border: '1px solid #f0b8b8',
            color: '#b42318',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* =========================
          SIMULATOR
      ========================= */}

      <section className="sim-layout">

        {/* =========================
            CONTROLS
        ========================= */}

        <div className="sim-controls">

          <div className="sim-panel-title">
            <Zap size={19} />
            Scenario Controls
          </div>

          {/* TRAFFIC */}

          <label>

            <div className="sim-label-row">

              <div className="traffic-heading">

                <span>
                  Traffic Congestion
                </span>

                {/* TRAFFIC LIGHT HOUSING */}

                <div className="traffic-status">

                  <span
                    className={`traffic-light traffic-green ${
                      traffic <= 33
                        ? 'active'
                        : ''
                    }`}
                  >
                    🟢
                  </span>

                  <span
                    className={`traffic-light traffic-yellow ${
                      traffic > 33 &&
                      traffic <= 66
                        ? 'active'
                        : ''
                    }`}
                  >
                    🟡
                  </span>

                  <span
                    className={`traffic-light traffic-red ${
                      traffic > 66
                        ? 'active'
                        : ''
                    }`}
                  >
                    🔴
                  </span>

                </div>

              </div>

              <strong>
                {traffic}%
              </strong>

            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={traffic}
              onChange={(e) => {
                setTraffic(
                  Number(e.target.value)
                )

                setResult(null)
              }}
            />

            <small>
              0% = free flow · 100% = severe
              congestion
            </small>

          </label>

          {/* DISPATCH */}

          <label>

            <div>
              <span>
                Dispatch Hour
              </span>

              <strong>
                {dispatch}:00
              </strong>
            </div>

            <input
              type="range"
              min="0"
              max="23"
              value={dispatch}
              onChange={(e) => {
                setDispatch(
                  Number(e.target.value)
                )

                setResult(null)
              }}
            />

            <small>
              Simulate a different departure time
            </small>

          </label>

          {/* VEHICLE EFFICIENCY */}

          <label>

            <div>
              <span>
                Vehicle Efficiency
              </span>

              <strong>
                {vehicleEfficiency}%
              </strong>
            </div>

            <input
              type="range"
              min="50"
              max="100"
              value={vehicleEfficiency}
              onChange={(e) => {
                setVehicleEfficiency(
                  Number(e.target.value)
                )

                setResult(null)
              }}
            />

            <small>
              Vehicle condition and operating
              efficiency
            </small>

          </label>

          {/* RUN BUTTON */}

          <button
            className="sim-run-button"
            onClick={runSimulation}
            disabled={loading}
          >
            <Zap size={16} />

            {loading
              ? 'Running Simulation...'
              : 'Run Simulation'}
          </button>

        </div>

        {/* =========================
            RESULTS
        ========================= */}

        <div className="sim-results">

          <div className="sim-panel-title">
            <Gauge size={19} />
            Predicted Outcome
          </div>

          <div className="sim-result-grid">

            {/* RISK */}

            <div className="sim-result-card">

              <div className="sim-result-icon">
                <ShieldIcon />
              </div>

              <span>
                Risk Score
              </span>

              <strong>
                {risk}
                <small>/100</small>
              </strong>

              <b
                className={
                  risk > 60
                    ? 'sim-high'
                    : risk > 30
                    ? 'sim-medium'
                    : 'sim-low'
                }
              >
                {riskLevel}
              </b>

            </div>

            {/* DELAY */}

            <div className="sim-result-card">

              <div className="sim-result-icon">
                <Route size={19} />
              </div>

              <span>
                Estimated Delay
              </span>

              <strong>
                {delay}
                <small> min</small>
              </strong>

              <b>
                {result
                  ? 'Backend Predicted'
                  : 'Scenario Preview'}
              </b>

            </div>

            {/* EFFICIENCY */}

            <div className="sim-result-card">

              <div className="sim-result-icon">
                <Truck size={19} />
              </div>

              <span>
                Efficiency Score
              </span>

              <strong>
                {efficiency}
                <small>/100</small>
              </strong>

              <b>
                {result
                  ? 'Backend Projected'
                  : 'Scenario Preview'}
              </b>

            </div>

          </div>

          {/* =========================
              EXPLANATION
          ========================= */}

          <div className="sim-explanation">

            <strong>
              Simulation Insight
            </strong>

            <p>
              With traffic at {traffic}% and a{' '}
              {dispatch}:00 dispatch, the model
              estimates a logistics risk score of{' '}
              {risk}/100 and approximately {delay}{' '}
              minutes of delay.

              {vehicleEfficiency >= 80
                ? ' Vehicle efficiency is contributing positively to the scenario.'
                : ' Lower vehicle efficiency is increasing operational risk.'}

              {result?.recommendation
                ? ` ${result.recommendation}`
                : ''}
            </p>

          </div>

        </div>

      </section>

    </div>
  )
}

function ShieldIcon() {
  return (
    <span className="shield-icon">
      !
    </span>
  )
}