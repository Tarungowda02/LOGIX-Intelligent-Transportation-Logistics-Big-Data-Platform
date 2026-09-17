import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Package,
  Search,
  Truck,
} from 'lucide-react'


// ============================================================
// TYPES
// ============================================================

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


// ============================================================
// SHIPMENTS PAGE
// ============================================================

function Shipments() {

  const [shipments, setShipments] = useState<Shipment[]>([])

  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(false)


  // ==========================================================
  // GET SHIPMENTS FROM FASTAPI
  // ==========================================================

  useEffect(() => {

    fetch('https://estimate-participation-sleep-extraordinary.trycloudflare.com/api/shipments')

      .then((response) => {

        if (!response.ok) {
          throw new Error('Failed to load shipments')
        }

        return response.json()
      })

      .then((data) => {

        console.log(
          'LOGIX Shipments Data:',
          data
        )

        setShipments(data.shipments || [])

        setLoading(false)

      })

      .catch((err) => {

        console.error(
          'LOGIX Shipments Error:',
          err
        )

        setError(true)

        setLoading(false)

      })

  }, [])


  // ==========================================================
  // SEARCH
  // ==========================================================

  const filtered = useMemo(() => {

    const q = search
      .toLowerCase()
      .trim()


    if (!q) {
      return shipments
    }


    return shipments.filter((s) => {

      const searchableText = `
        ${s.shipment_id}
        ${s.origin}
        ${s.destination}
        ${s.vehicle_id}
        ${s.status}
        ${s.priority}
      `.toLowerCase()


      return searchableText.includes(q)

    })

  }, [search, shipments])


  // ==========================================================
  // SUMMARY VALUES
  // ==========================================================

  const totalShipments =
    shipments.length


  const inTransit =
    shipments.filter(
      (s) =>
        s.status.toLowerCase() === 'in transit'
    ).length


  const delivered =
    shipments.filter(
      (s) =>
        s.status.toLowerCase() === 'delivered'
    ).length


  const delayed =
    shipments.filter(
      (s) =>
        s.status.toLowerCase() === 'delayed'
    ).length


  const onTimeRate =
    totalShipments > 0
      ? Math.round(
          (delivered / totalShipments) * 100
        )
      : 0


  // ==========================================================
  // DATE DISPLAY
  // ==========================================================


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="shipments-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="shipments-header">

        <div>

          <div className="breadcrumb">

            LOGIX

            <span>/</span>

            INTELLIGENCE

            <span>/</span>

            SHIPMENTS

          </div>


          <h1>
            Shipment Intelligence
          </h1>


          <p>
            Monitor shipment movement, delivery performance and operational
            status across the logistics network.
          </p>

        </div>

      </header>


      {/* ======================================================
          ERROR
      ====================================================== */}

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

          Unable to connect to LOGIX backend.
          Make sure FastAPI is running on port 8000.

        </div>

      )}


      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <section className="shipment-summary-grid">


        {/* TOTAL */}

        <div className="shipment-summary-card">

          <div className="shipment-summary-top">

            <span className="shipment-summary-label">
              Total Shipments
            </span>


            <div className="shipment-summary-icon">

              <Package size={19} />

            </div>

          </div>


          <div className="shipment-summary-value">

            {loading
              ? '...'
              : totalShipments.toLocaleString()}

          </div>


          <div className="shipment-summary-note">

            Live from LOGIX backend

          </div>

        </div>


        {/* IN TRANSIT */}

        <div className="shipment-summary-card">

          <div className="shipment-summary-top">

            <span className="shipment-summary-label">
              In Transit
            </span>


            <div className="shipment-summary-icon">

              <Truck size={19} />

            </div>

          </div>


          <div className="shipment-summary-value">

            {loading
              ? '...'
              : inTransit.toLocaleString()}

          </div>


          <div className="shipment-summary-note">

            Active across routes

          </div>

        </div>


        {/* DELIVERED */}

        <div className="shipment-summary-card">

          <div className="shipment-summary-top">

            <span className="shipment-summary-label">
              Delivered
            </span>


            <div className="shipment-summary-icon">

              <CheckCircle2 size={19} />

            </div>

          </div>


          <div className="shipment-summary-value">

            {loading
              ? '...'
              : delivered.toLocaleString()}

          </div>


          <div className="shipment-summary-note">

            {onTimeRate}% on-time rate

          </div>

        </div>


        {/* DELAYED */}

        <div className="shipment-summary-card">

          <div className="shipment-summary-top">

            <span className="shipment-summary-label">
              Delayed
            </span>


            <div className="shipment-summary-icon">

              <Clock3 size={19} />

            </div>

          </div>


          <div className="shipment-summary-value">

            {loading
              ? '...'
              : delayed.toLocaleString()}

          </div>


          <div className="shipment-summary-note">

            Live delayed shipments

          </div>

        </div>

      </section>


      {/* ======================================================
          SHIPMENT TABLE
      ====================================================== */}

      <section className="shipments-table-card">


        {/* TABLE HEADER */}

        <div className="shipments-table-header">

          <h2 className="shipments-table-title">
            Shipment Records
          </h2>


          <p className="shipments-table-description">
            Distributed shipment dataset retrieved from the LOGIX data platform.
          </p>

        </div>


        {/* TOOLBAR */}

        <div className="shipments-toolbar">


          <div className="shipment-search-wrap">

            <Search size={16} />


            <input
              className="shipment-search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search shipment, route or vehicle..."
            />

          </div>


          <button className="secondary-button small">

            <ArrowUpRight size={15} />

            Export View

          </button>

        </div>


        {/* TABLE */}

        <div className="shipments-table-wrapper">

          <table className="shipments-table">

            <thead>

              <tr>

                <th>
                  SHIPMENT ID
                </th>

                <th>
                  ROUTE
                </th>

                <th>
                  VEHICLE
                </th>

                <th>
                  DISTANCE
                </th>

                <th>
                  WEIGHT
                </th>

                <th>
                  STATUS
                </th>

                <th>
                  DELAY
                </th>

              </tr>

            </thead>


            <tbody>


              {/* LOADING */}

              {loading && (

                <tr>

                  <td
                    colSpan={7}
                    style={{
                      textAlign: 'center',
                      padding: '40px',
                    }}
                  >

                    Loading shipment data...

                  </td>

                </tr>

              )}


              {/* NO RESULTS */}

              {!loading &&
                filtered.length === 0 && (

                  <tr>

                    <td
                      colSpan={7}
                      style={{
                        textAlign: 'center',
                        padding: '40px',
                      }}
                    >

                      No shipments found.

                    </td>

                  </tr>

                )}


              {/* DATA */}

              {!loading &&
                filtered.map((s) => (

                  <tr key={s.shipment_id}>


                    {/* ID */}

                    <td>

                      <span className="shipment-id">

                        {s.shipment_id}

                      </span>

                    </td>


                    {/* ROUTE */}

                    <td>

                      <span className="shipment-route">

                        {s.origin}

                        {' → '}

                        {s.destination}

                      </span>

                    </td>


                    {/* VEHICLE */}

                    <td>

                      {s.vehicle_id}

                    </td>


                    {/* DISTANCE */}

                    <td>

                      {s.distance_km} km

                    </td>


                    {/* WEIGHT */}

                    <td>

                      {s.weight_kg.toLocaleString()} kg

                    </td>


                    {/* STATUS */}

                    <td>

                      <span
                        className={`shipment-status shipment-status-${s.status
                          .toLowerCase()
                          .replace(/\s+/g, '-')}`}
                      >

                        {s.status}

                      </span>

                    </td>


                    {/* DELAY */}

                    <td>

                      {s.delay_minutes === 0
                        ? 'On time'
                        : `+${s.delay_minutes} min`}

                    </td>


                  </tr>

                ))}

            </tbody>

          </table>

        </div>

      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="dashboard-footer">

        <span>
          LOGIX Shipment Intelligence
        </span>


        <span>

          Distributed Retrieval

          <b> • </b>

          Delivery Analytics

          <b> • </b>

          Operational Monitoring

        </span>

      </footer>

    </div>

  )
}


export default Shipments