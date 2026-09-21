import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Car,
  CheckCircle2,
  Search,
  Settings2,
  Truck,
} from 'lucide-react'


// ============================================================
// TYPES
// ============================================================

type Vehicle = {
  vehicle_id: string
  vehicle_type: string
  capacity_kg: number
  fuel_type: string
  mileage: number
  maintenance_status: string
  vehicle_age: number
}


// ============================================================
// FLEET
// ============================================================

function Fleet() {

  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(false)


  // ==========================================================
  // GET FLEET DATA FROM FASTAPI
  // ==========================================================

  useEffect(() => {

    fetch('/api/fleet')

      .then((response) => {

        if (!response.ok) {
          throw new Error('Failed to load fleet')
        }

        return response.json()
      })

      .then((data) => {

        console.log(
          'LOGIX Fleet Data:',
          data
        )

        setVehicles(data.vehicles || [])

        setLoading(false)

      })

      .catch((err) => {

        console.error(
          'LOGIX Fleet Error:',
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
      return vehicles
    }

    return vehicles.filter((vehicle) => {

      const searchableText = `
        ${vehicle.vehicle_id}
        ${vehicle.vehicle_type}
        ${vehicle.fuel_type}
        ${vehicle.maintenance_status}
      `.toLowerCase()

      return searchableText.includes(q)

    })

  }, [search, vehicles])


  // ==========================================================
  // FLEET STATISTICS
  // ==========================================================

  const totalFleet =
    vehicles.length


  const maintenanceVehicles =
    vehicles.filter(
      (vehicle) =>
        vehicle.maintenance_status
          .toLowerCase()
          .includes('service')
    ).length


  const activeVehicles =
    totalFleet - maintenanceVehicles


  const attentionRequired =
    vehicles.filter(
      (vehicle) =>
        vehicle.maintenance_status
          .toLowerCase()
          .includes('service')
    ).length


  const activePercentage =
    totalFleet > 0
      ? Math.round(
          (activeVehicles / totalFleet) * 100
        )
      : 0


  // ==========================================================
  // VEHICLE HEALTH
  // ==========================================================

  const getHealth = (
    maintenanceStatus: string
  ) => {

    if (
      maintenanceStatus
        .toLowerCase()
        .includes('service')
    ) {
      return 'Critical'
    }

    if (
      maintenanceStatus
        .toLowerCase()
        .includes('warning')
    ) {
      return 'Warning'
    }

    return 'Good'
  }


  // ==========================================================
  // VEHICLE STATUS
  // ==========================================================

  const getStatus = (
    maintenanceStatus: string
  ) => {

    if (
      maintenanceStatus
        .toLowerCase()
        .includes('service')
    ) {
      return 'Maintenance Soon'
    }

    return 'Active'
  }


  // ==========================================================
  // UTILIZATION
  // ==========================================================

  const getUtilization = (
    vehicle: Vehicle
  ) => {

    const capacityFactor =
      Math.min(
        vehicle.capacity_kg / 12000,
        1
      )

    const ageFactor =
      Math.max(
        0,
        1 - vehicle.vehicle_age * 0.04
      )

    const mileageFactor =
      Math.max(
        0.55,
        1 - vehicle.mileage / 250000
      )

    const utilization =
      Math.round(
        (
          capacityFactor * 45 +
          ageFactor * 30 +
          mileageFactor * 25
        )
      )

    return Math.max(
      40,
      Math.min(utilization, 98)
    )
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="fleet-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="fleet-header">

        <div>

          <div className="breadcrumb">

            LOGIX

            <span>/</span>

            INTELLIGENCE

            <span>/</span>

            FLEET

          </div>


          <h1>
            Fleet Intelligence
          </h1>


          <p>
            Analyze vehicle utilization, reliability, maintenance status and
            fleet performance across operations.
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
          SUMMARY
      ====================================================== */}

      <section className="fleet-summary-grid">


        {/* TOTAL FLEET */}

        <div className="fleet-summary-card">

          <div className="fleet-summary-top">

            <span className="fleet-summary-label">
              Total Fleet
            </span>

            <div className="fleet-summary-icon">

              <Car size={19} />

            </div>

          </div>


          <div className="fleet-summary-value">

            {loading
              ? '...'
              : totalFleet.toLocaleString()}

          </div>


          <div className="fleet-summary-note">
            Registered vehicles
          </div>

        </div>


        {/* ACTIVE */}

        <div className="fleet-summary-card">

          <div className="fleet-summary-top">

            <span className="fleet-summary-label">
              Active Vehicles
            </span>

            <div className="fleet-summary-icon">

              <Truck size={19} />

            </div>

          </div>


          <div className="fleet-summary-value">

            {loading
              ? '...'
              : activeVehicles.toLocaleString()}

          </div>


          <div className="fleet-summary-note">

            {activePercentage}% currently active

          </div>

        </div>


        {/* MAINTENANCE */}

        <div className="fleet-summary-card">

          <div className="fleet-summary-top">

            <span className="fleet-summary-label">
              Maintenance
            </span>

            <div className="fleet-summary-icon">

              <Settings2 size={19} />

            </div>

          </div>


          <div className="fleet-summary-value">

            {loading
              ? '...'
              : maintenanceVehicles.toLocaleString()}

          </div>


          <div className="fleet-summary-note">
            Scheduled maintenance
          </div>

        </div>


        {/* ATTENTION */}

        <div className="fleet-summary-card">

          <div className="fleet-summary-top">

            <span className="fleet-summary-label">
              Attention Required
            </span>

            <div className="fleet-summary-icon">

              <AlertTriangle size={19} />

            </div>

          </div>


          <div className="fleet-summary-value">

            {loading
              ? '...'
              : attentionRequired.toLocaleString()}

          </div>


          <div className="fleet-summary-note">
            Requires inspection
          </div>

        </div>

      </section>


      {/* ======================================================
          PERFORMANCE + STATUS
      ====================================================== */}

      <section className="fleet-content-grid">


        {/* FLEET PERFORMANCE */}

        <div className="fleet-performance-card">

          <div className="fleet-card-header">

            <div className="fleet-card-title">
              Fleet Performance
            </div>

            <div className="fleet-card-subtitle">
              Overall vehicle performance score
            </div>

          </div>


          <div className="fleet-card-body">

            <div className="fleet-score">

              <div className="fleet-score-value">

                91<span>/100</span>

              </div>


              <div className="fleet-score-description">

                Excellent
                <br />

                Fleet reliability remains strong.

              </div>

            </div>


            <div className="fleet-progress">

              <div
                className="fleet-progress-fill"
                style={{
                  width: '91%',
                }}
              />

            </div>

          </div>

        </div>


        {/* FLEET STATUS */}

        <div className="fleet-status-card">

          <div className="fleet-card-header">

            <div className="fleet-card-title">
              Fleet Status
            </div>

            <div className="fleet-card-subtitle">
              Current operational distribution
            </div>

          </div>


          <div className="fleet-card-body">

            <div className="fleet-status-list">


              <div className="fleet-status-row">

                <span className="fleet-status-name">
                  Active
                </span>

                <span className="fleet-status-value">
                  {activeVehicles}
                </span>

              </div>


              <div className="fleet-status-row">

                <span className="fleet-status-name">
                  Maintenance
                </span>

                <span className="fleet-status-value">
                  {maintenanceVehicles}
                </span>

              </div>


              <div className="fleet-status-row">

                <span className="fleet-status-name">
                  Inspection
                </span>

                <span className="fleet-status-value">
                  {attentionRequired}
                </span>

              </div>


              <div className="fleet-status-row">

                <span className="fleet-status-name">
                  Idle
                </span>

                <span className="fleet-status-value">
                  0
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          VEHICLE RECORDS
      ====================================================== */}

      <section className="fleet-records-card">


        <div className="fleet-records-header">

          <h2 className="fleet-records-title">
            Vehicle Records
          </h2>


          <p className="fleet-records-description">

            Vehicle performance and operational health retrieved from the
            distributed fleet dataset.

          </p>

        </div>


        {/* SEARCH */}

        <div className="shipments-toolbar">

          <div className="shipment-search-wrap">

            <Search size={16} />

            <input
              className="shipment-search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search registration or vehicle type..."
            />

          </div>


          <button className="secondary-button small">

            <Activity size={15} />

            Fleet Analytics

          </button>

        </div>


        {/* TABLE */}

        <div className="fleet-table-wrapper">

          <table className="fleet-table">

            <thead>

              <tr>

                <th>
                  VEHICLE
                </th>

                <th>
                  MILEAGE
                </th>

                <th>
                  UTILIZATION
                </th>

                <th>
                  HEALTH
                </th>

                <th>
                  STATUS
                </th>

              </tr>

            </thead>


            <tbody>


              {loading && (

                <tr>

                  <td
                    colSpan={5}
                    style={{
                      textAlign: 'center',
                      padding: '40px',
                    }}
                  >

                    Loading fleet data...

                  </td>

                </tr>

              )}


              {!loading &&
                filtered.length === 0 && (

                  <tr>

                    <td
                      colSpan={5}
                      style={{
                        textAlign: 'center',
                        padding: '40px',
                      }}
                    >

                      No vehicles found.

                    </td>

                  </tr>

                )}


              {!loading &&
                filtered.map((vehicle) => {

                  const health =
                    getHealth(
                      vehicle.maintenance_status
                    )

                  const status =
                    getStatus(
                      vehicle.maintenance_status
                    )

                  const utilization =
                    getUtilization(vehicle)


                  return (

                    <tr
                      key={vehicle.vehicle_id}
                    >


                      {/* VEHICLE */}

                      <td>

                        <div className="vehicle-registration">

                          {vehicle.vehicle_id}

                        </div>


                        <div className="vehicle-type">

                          {vehicle.vehicle_type}

                        </div>

                      </td>


                      {/* MILEAGE */}

                      <td>

                        {vehicle.mileage.toLocaleString()} km

                      </td>


                      {/* UTILIZATION */}

                      <td>

                        <div className="vehicle-utilization">

                          <div className="vehicle-utilization-top">

                            <span>
                              Utilization
                            </span>

                            <span className="vehicle-utilization-value">

                              {utilization}%

                            </span>

                          </div>


                          <div className="vehicle-utilization-bar">

                            <div
                              className="vehicle-utilization-fill"
                              style={{
                                width: `${utilization}%`,
                              }}
                            />

                          </div>

                        </div>

                      </td>


                      {/* HEALTH */}

                      <td>

                        <span
                          className={`vehicle-health vehicle-health-${health.toLowerCase()}`}
                        >

                          {health === 'Good' ? (

                            <CheckCircle2 size={12} />

                          ) : (

                            <AlertTriangle size={12} />

                          )}

                          {health}

                        </span>

                      </td>


                      {/* STATUS */}

                      <td>

                        {status}

                      </td>

                    </tr>

                  )

                })}

            </tbody>

          </table>

        </div>

      </section>


      {/* ======================================================
          INSIGHT
      ====================================================== */}

      <section className="fleet-insight-card">

        <div className="fleet-insight-icon">

          <AlertTriangle size={20} />

        </div>


        <div>

          <h3 className="fleet-insight-title">

            Fleet Intelligence Insight

          </h3>


          <p className="fleet-insight-text">

            Most of the active fleet is operating within healthy utilization
            levels. Vehicles with higher mileage and maintenance requirements
            should be prioritized for preventive maintenance.

          </p>

        </div>

      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="dashboard-footer">

        <span>
          LOGIX Fleet Intelligence
        </span>


        <span>

          Vehicle Analytics

          <b> • </b>

          Utilization

          <b> • </b>

          Maintenance Intelligence

        </span>

      </footer>

    </div>
  )
}


export default Fleet