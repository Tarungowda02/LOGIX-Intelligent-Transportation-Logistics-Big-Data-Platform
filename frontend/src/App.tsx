import { useEffect, useState } from 'react'

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Car,
  ChevronRight,
  CircleGauge,
  Database,
  Gauge,
  LayoutDashboard,
  Map,
  Package,
  Route,
  Settings,
  Truck,
  Upload,
  Zap,
} from 'lucide-react'

import Shipments from './pages/Shipments'
import Fleet from './pages/Fleet'
import Routes from './pages/Routes'
import Analytics from './pages/Analytics'
import RiskCenter from './pages/RiskCenter'
import Simulator from './pages/Simulator'
import SystemSettings from './pages/SystemSettings'
import './App.css'


// ============================================================
// TYPES
// ============================================================

type DashboardData = {
  total_shipments: number
  delivered: number
  delayed: number
  in_transit: number
  average_delay_minutes: number
  fleet_size: number
  routes: number
}


// ============================================================
// STATIC DATA
// ============================================================

const activities = [
  {
    title: 'Shipment data processed',
    description: 'MapReduce job completed successfully',
    time: '2 min ago',
    icon: Database,
  },
  {
    title: 'Route risk detected',
    description: 'Bangalore → Chennai corridor',
    time: '8 min ago',
    icon: AlertTriangle,
  },
  {
    title: 'Fleet analytics updated',
    description: 'Fleet vehicle records analyzed',
    time: '15 min ago',
    icon: BarChart3,
  },
  {
    title: 'Hive query completed',
    description: 'Regional shipment analysis',
    time: '22 min ago',
    icon: Activity,
  },
]


const routes = [
  {
    route: 'Bangalore → Chennai',
    distance: '347 km',
    risk: 'High',
    efficiency: '72%',
  },
  {
    route: 'Mumbai → Pune',
    distance: '150 km',
    risk: 'Low',
    efficiency: '94%',
  },
  {
    route: 'Delhi → Jaipur',
    distance: '281 km',
    risk: 'Moderate',
    efficiency: '86%',
  },
  {
    route: 'Hyderabad → Bangalore',
    distance: '570 km',
    risk: 'Low',
    efficiency: '91%',
  },
]


// ============================================================
// NAVIGATION
// ============================================================

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Shipments', icon: Package },
  { label: 'Fleet', icon: Car },
  { label: 'Routes', icon: Route },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Risk Center', icon: AlertTriangle },
  { label: 'Simulator', icon: Zap },
]


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null)

  const [apiError, setApiError] =
    useState(false)


  // ----------------------------------------------------------
  // CONNECT TO FASTAPI
  // ----------------------------------------------------------

  useEffect(() => {

    fetch('https://estimate-participation-sleep-extraordinary.trycloudflare.com/api/dashboard')

      .then((response) => {

        if (!response.ok) {
          throw new Error('Backend request failed')
        }

        return response.json()
      })

      .then((data: DashboardData) => {

        console.log('LOGIX Dashboard Data:', data)

        setDashboard(data)
        setApiError(false)
      })

      .catch((error) => {

        console.error(
          'LOGIX Dashboard Error:',
          error
        )

        setApiError(true)
      })

  }, [])


  // ----------------------------------------------------------
  // KPI VALUES
  // ----------------------------------------------------------

  const totalShipments =
    dashboard?.total_shipments ?? 0

  const fleetSize =
    dashboard?.fleet_size ?? 0

  const delayed =
    dashboard?.delayed ?? 0

  const delivered =
    dashboard?.delivered ?? 0


  const onTimePercentage =
    totalShipments > 0
      ? Math.round(
          (delivered / totalShipments) * 100
        )
      : 0


  const kpis = [

    {
      title: 'Total Shipments',
      value: totalShipments.toLocaleString(),
      change: dashboard ? 'LIVE' : 'LOADING',
      icon: Package,
    },

    {
      title: 'Active Vehicles',
      value: fleetSize.toLocaleString(),
      change: dashboard ? 'LIVE' : 'LOADING',
      icon: Truck,
    },

    {
      title: 'On-Time Delivery',
      value: `${onTimePercentage}%`,
      change: dashboard ? 'LIVE' : 'LOADING',
      icon: CircleGauge,
    },

    {
      title: 'High Risk Routes',
      value: delayed.toLocaleString(),
      change: dashboard ? 'LIVE' : 'LOADING',
      icon: AlertTriangle,
    },

  ]


  // ==========================================================
  // DASHBOARD UI
  // ==========================================================

  return (
    <>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="topbar">

        <div>

          <div className="breadcrumb">
            LOGIX <span>/</span> COMMAND CENTER
          </div>

          <h1>
            Transportation Intelligence
          </h1>

          <p>
            Distributed logistics data, analytics and operational intelligence.
          </p>

        </div>


        <div className="header-actions">

          <button className="secondary-button">

            <Upload size={17} />

            Import Data

          </button>


          <button className="primary-button">

            <Zap size={17} />

            Run Analysis

          </button>

        </div>

      </header>


      {/* ======================================================
          BACKEND STATUS
      ====================================================== */}

      {apiError && (

        <div
          style={{
            padding: '10px 16px',
            marginBottom: '16px',
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
          KPI CARDS
      ====================================================== */}

      <section className="kpi-grid">

        {kpis.map((kpi) => {

          const Icon = kpi.icon

          return (

            <div
              className="kpi-card"
              key={kpi.title}
            >

              <div className="kpi-top">

                <div className="kpi-icon">

                  <Icon size={20} />

                </div>


                <span className="kpi-change">

                  {kpi.change}

                </span>

              </div>


              <div className="kpi-value">

                {kpi.value}

              </div>


              <div className="kpi-title">

                {kpi.title}

              </div>

            </div>

          )

        })}

      </section>


      {/* ======================================================
          DASHBOARD GRID
      ====================================================== */}

      <section className="dashboard-grid">


        {/* SYSTEM ACTIVITY */}

        <div className="panel activity-panel">

          <div className="panel-header">

            <div>

              <h2>
                System Activity
              </h2>

              <p>
                Latest platform operations
              </p>

            </div>


            <button className="text-button">

              View All

              <ChevronRight size={15} />

            </button>

          </div>


          <div className="activity-list">

            {activities.map((activity) => {

              const Icon = activity.icon

              return (

                <div
                  className="activity-item"
                  key={activity.title}
                >

                  <div className="activity-icon">

                    <Icon size={18} />

                  </div>


                  <div className="activity-info">

                    <strong>
                      {activity.title}
                    </strong>

                    <span>
                      {activity.description}
                    </span>

                  </div>


                  <time>
                    {activity.time}
                  </time>

                </div>

              )

            })}

          </div>

        </div>


        {/* DATA INFRASTRUCTURE */}

        <div className="panel infrastructure-panel">

          <div className="panel-header">

            <div>

              <h2>
                Data Infrastructure
              </h2>

              <p>
                Distributed processing status
              </p>

            </div>


            <Database size={21} />

          </div>


          <div className="infra-main">

            <div className="hdfs-circle">

              <Database size={28} />

              <strong>
                HDFS
              </strong>

              <span>
                ONLINE
              </span>

            </div>


            <div className="infra-stats">

              <div>

                <span>
                  Storage Used
                </span>

                <strong>
                  64.8 TB
                </strong>

              </div>


              <div>

                <span>
                  Data Nodes
                </span>

                <strong>
                  06 / 06
                </strong>

              </div>


              <div>

                <span>
                  Processing Jobs
                </span>

                <strong>
                  24
                </strong>

              </div>

            </div>

          </div>


          <div className="cluster-bar">

            <div className="cluster-progress"></div>

          </div>


          <div className="cluster-footer">

            <span>
              Cluster utilization
            </span>

            <strong>
              68%
            </strong>

          </div>

        </div>

      </section>


      {/* ======================================================
          ROUTE INTELLIGENCE
      ====================================================== */}

      <section className="panel route-panel">

        <div className="panel-header">

          <div>

            <h2>
              Route Intelligence
            </h2>

            <p>
              Live performance overview of major logistics corridors
            </p>

          </div>


          <button className="secondary-button small">

            <Map size={16} />

            Explore Routes

          </button>

        </div>


        <div className="route-table">


          <div className="route-row route-heading">

            <span>
              ROUTE
            </span>

            <span>
              DISTANCE
            </span>

            <span>
              RISK LEVEL
            </span>

            <span>
              EFFICIENCY
            </span>

            <span></span>

          </div>


          {routes.map((route) => (

            <div
              className="route-row"
              key={route.route}
            >

              <div className="route-name">

                <div className="route-icon">

                  <Route size={16} />

                </div>


                <strong>
                  {route.route}
                </strong>

              </div>


              <span>
                {route.distance}
              </span>


              <span
                className={`risk-badge ${route.risk
                  .toLowerCase()
                  .replace(' ', '-')}`}
              >

                {route.risk}

              </span>


              <div className="efficiency">

                <div className="efficiency-bar">

                  <div
                    className="efficiency-fill"
                    style={{
                      width: route.efficiency,
                    }}
                  />

                </div>


                <strong>
                  {route.efficiency}
                </strong>

              </div>


              <ChevronRight
                size={17}
                className="row-arrow"
              />

            </div>

          ))}

        </div>

      </section>


      {/* ======================================================
          SCORE CARDS
      ====================================================== */}

      <section className="score-grid">


        {/* LOGISTICS RISK SCORE */}

        <div className="score-card">

          <div className="score-card-header">

            <div>

              <span>
                LOGISTICS RISK SCORE
              </span>

              <h3>
                Operational Risk
              </h3>

            </div>


            <AlertTriangle size={20} />

          </div>


          <div className="score-content">

            <div className="score-number">

              38<span>/100</span>

            </div>


            <div className="score-status moderate">

              MODERATE

            </div>

          </div>


          <p>
            Risk is primarily influenced by traffic congestion and historical
            delivery delays.
          </p>

        </div>


        {/* ROUTE EFFICIENCY SCORE */}

        <div className="score-card">

          <div className="score-card-header">

            <div>

              <span>
                ROUTE EFFICIENCY SCORE
              </span>

              <h3>
                Network Efficiency
              </h3>

            </div>


            <Gauge size={20} />

          </div>


          <div className="score-content">

            <div className="score-number">

              86<span>/100</span>

            </div>


            <div className="score-status excellent">

              EXCELLENT

            </div>

          </div>


          <p>
            Current routes are performing above the historical network
            efficiency baseline.
          </p>

        </div>


        {/* VEHICLE PERFORMANCE SCORE */}

        <div className="score-card">

          <div className="score-card-header">

            <div>

              <span>
                VEHICLE PERFORMANCE SCORE
              </span>

              <h3>
                Fleet Health
              </h3>

            </div>


            <Truck size={20} />

          </div>


          <div className="score-content">

            <div className="score-number">

              91<span>/100</span>

            </div>


            <div className="score-status excellent">

              EXCELLENT

            </div>

          </div>


          <p>
            Fleet reliability remains strong with high vehicle utilization
            across active logistics operations.
          </p>

        </div>

      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="dashboard-footer">

        <span>
          LOGIX Intelligence Platform
        </span>


        <span>

          Hadoop Ecosystem

          <b> • </b>

          Hive

          <b> • </b>

          MapReduce

          <b> • </b>

          HDFS

        </span>

      </footer>

    </>
  )
}


// ============================================================
// MAIN APP
// ============================================================

function App() {

  const [activePage, setActivePage] =
    useState('Dashboard')


  return (

    <div className="app-shell">


      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">


        <div className="brand">

          <div className="brand-mark">
            L
          </div>


          <div>

            <div className="brand-name">
              LOGIX
            </div>


            <div className="brand-subtitle">
              TRANSPORT INTELLIGENCE
            </div>

          </div>

        </div>


        <div className="sidebar-section">

          <span>
            OPERATIONS
          </span>

        </div>


        <nav className="nav-menu">

          {navItems.map((item) => {

            const Icon = item.icon

            const isActive =
              activePage === item.label


            return (

              <button
                key={item.label}
                className={`nav-item ${
                  isActive ? 'active' : ''
                }`}
                onClick={() =>
                  setActivePage(item.label)
                }
              >

                <Icon
                  size={19}
                  strokeWidth={1.8}
                />


                <span>
                  {item.label}
                </span>


                {isActive && (
                  <ChevronRight size={16} />
                )}

              </button>

            )

          })}

        </nav>


        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

        <button
  className={`nav-item ${
    activePage === 'system-settings' ? 'active' : ''
  }`}
  onClick={() => setActivePage('system-settings')}
>
  <Settings size={19} />

  <span>
    System Settings
  </span>

  {activePage === 'system-settings' && (
    <ChevronRight size={16} />
  )}
</button>


          <div className="system-status">

            <div className="status-dot"></div>


            <div>

              <strong>
                System Online
              </strong>

              <span>
                Hadoop Cluster Healthy
              </span>

            </div>

          </div>

        </div>

      </aside>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="main-content">

        {activePage === 'Dashboard' && (
          <Dashboard />
        )}


        {activePage === 'Shipments' && (
          <Shipments />
        )}


        {activePage === 'Fleet' && (
          <Fleet />
        )}


        {activePage === 'Routes' && (
          <Routes />
        )}


        {activePage === 'Analytics' && (
          <Analytics />
        )}


        {activePage === 'Risk Center' && (
          <RiskCenter />
        )}


        {activePage === 'Simulator' && (
          <Simulator />
        )}
        {activePage === 'system-settings' && (
          <SystemSettings />
      )}

      </main>

    </div>

  )
}


export default App