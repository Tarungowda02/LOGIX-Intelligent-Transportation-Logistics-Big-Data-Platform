import { useState } from 'react'
import {
  Bell,
  Database,
  HardDrive,
  RefreshCw,
  Save,
  Server,
  Shield,
  SlidersHorizontal,
  Wifi,
} from 'lucide-react'
import './SystemSettings.css'

export default function SystemSettings() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [riskAlerts, setRiskAlerts] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const [saved, setSaved] = useState(false)

  const saveSettings = () => {
    setSaved(true)

    setTimeout(() => {
      setSaved(false)
    }, 2500)
  }

  return (
    <div className="settings-page">

      {/* HEADER */}

      <header className="module-header">
        <div>
          <div className="module-breadcrumb">
            LOGIX <span>/</span> SYSTEM SETTINGS
          </div>

          <h1>System Settings</h1>

          <p>
            Configure LOGIX platform behavior, data services,
            monitoring and intelligence preferences.
          </p>
        </div>

        <button
          className="settings-save-button"
          onClick={saveSettings}
        >
          <Save size={16} />
          Save Changes
        </button>
      </header>

      {saved && (
        <div className="settings-success">
          <span>✓</span>
          LOGIX settings saved successfully.
        </div>
      )}

      {/* SYSTEM STATUS */}

      <section className="settings-status-grid">

        <div className="settings-status-card">
          <div className="settings-status-icon">
            <Server size={19} />
          </div>

          <div>
            <span>Backend API</span>
            <strong>Online</strong>
            <small>FastAPI · Port 8000</small>
          </div>

          <div className="settings-online-dot" />
        </div>

        <div className="settings-status-card">
          <div className="settings-status-icon">
            <Database size={19} />
          </div>

          <div>
            <span>Data Platform</span>
            <strong>Ready</strong>
            <small>LOGIX Data Layer</small>
          </div>

          <div className="settings-online-dot" />
        </div>

        <div className="settings-status-card">
          <div className="settings-status-icon">
            <HardDrive size={19} />
          </div>

          <div>
            <span>Distributed Storage</span>
            <strong>Standby</strong>
            <small>HDFS Integration</small>
          </div>

          <div className="settings-status-dot standby" />
        </div>

        <div className="settings-status-card">
          <div className="settings-status-icon">
            <Wifi size={19} />
          </div>

          <div>
            <span>System Connection</span>
            <strong>Stable</strong>
            <small>Local network</small>
          </div>

          <div className="settings-online-dot" />
        </div>

      </section>

      {/* SETTINGS GRID */}

      <section className="settings-grid">

        {/* GENERAL */}

        <div className="settings-panel">

          <div className="settings-panel-header">
            <div className="settings-panel-icon">
              <SlidersHorizontal size={19} />
            </div>

            <div>
              <h2>General Configuration</h2>
              <p>Control core LOGIX platform behavior.</p>
            </div>
          </div>

          <div className="settings-options">

            <div className="settings-option">
              <div>
                <strong>Automatic Data Refresh</strong>
                <span>
                  Refresh operational data automatically.
                </span>
              </div>

              <button
                className={`settings-toggle ${
                  autoRefresh ? 'active' : ''
                }`}
                onClick={() =>
                  setAutoRefresh(!autoRefresh)
                }
                aria-label="Toggle automatic data refresh"
              >
                <span />
              </button>
            </div>

            <div className="settings-option">
              <div>
                <strong>System Notifications</strong>
                <span>
                  Receive important platform notifications.
                </span>
              </div>

              <button
                className={`settings-toggle ${
                  notifications ? 'active' : ''
                }`}
                onClick={() =>
                  setNotifications(!notifications)
                }
                aria-label="Toggle system notifications"
              >
                <span />
              </button>
            </div>

          </div>

        </div>

        {/* RISK ENGINE */}

        <div className="settings-panel">

          <div className="settings-panel-header">
            <div className="settings-panel-icon">
              <Shield size={19} />
            </div>

            <div>
              <h2>Risk Intelligence</h2>
              <p>Configure logistics risk monitoring.</p>
            </div>
          </div>

          <div className="settings-options">

            <div className="settings-option">
              <div>
                <strong>Risk Alerts</strong>
                <span>
                  Alert when routes exceed risk thresholds.
                </span>
              </div>

              <button
                className={`settings-toggle ${
                  riskAlerts ? 'active' : ''
                }`}
                onClick={() =>
                  setRiskAlerts(!riskAlerts)
                }
                aria-label="Toggle risk alerts"
              >
                <span />
              </button>
            </div>

            <div className="settings-option">
              <div>
                <strong>Risk Engine</strong>
                <span>
                  Current intelligence engine status.
                </span>
              </div>

              <span className="settings-engine-status">
                ONLINE
              </span>
            </div>

          </div>

        </div>

        {/* DATA PLATFORM */}

        <div className="settings-panel">

          <div className="settings-panel-header">
            <div className="settings-panel-icon">
              <Database size={19} />
            </div>

            <div>
              <h2>Data Platform</h2>
              <p>Transportation data infrastructure.</p>
            </div>
          </div>

          <div className="settings-info-list">

            <div>
              <span>API Endpoint</span>
              <strong>localhost:8000</strong>
            </div>

            <div>
              <span>Data Processing</span>
              <strong>FastAPI</strong>
            </div>

            <div>
              <span>Storage Architecture</span>
              <strong>Hadoop / HDFS</strong>
            </div>

            <div>
              <span>Query Layer</span>
              <strong>Hive</strong>
            </div>

          </div>

        </div>

        {/* MAINTENANCE */}

        <div className="settings-panel">

          <div className="settings-panel-header">
            <div className="settings-panel-icon">
              <RefreshCw size={19} />
            </div>

            <div>
              <h2>Maintenance</h2>
              <p>System maintenance controls.</p>
            </div>
          </div>

          <div className="settings-options">

            <div className="settings-option">
              <div>
                <strong>Maintenance Mode</strong>
                <span>
                  Temporarily restrict operational processing.
                </span>
              </div>

              <button
                className={`settings-toggle ${
                  maintenanceMode ? 'active' : ''
                }`}
                onClick={() =>
                  setMaintenanceMode(!maintenanceMode)
                }
                aria-label="Toggle maintenance mode"
              >
                <span />
              </button>
            </div>

            <div className="settings-maintenance-warning">
              {maintenanceMode
                ? 'Maintenance mode is enabled.'
                : 'System is operating normally.'}
            </div>

          </div>

        </div>

      </section>

      {/* SYSTEM INFORMATION */}

      <section className="settings-system-info">

        <div className="settings-system-info-icon">
          <Bell size={19} />
        </div>

        <div>
          <strong>LOGIX Platform Configuration</strong>

          <p>
            These settings control the local LOGIX intelligence
            environment. Hadoop, HDFS, MapReduce and Hive
            configuration will become available when the
            distributed data layer is activated.
          </p>
        </div>

        <div className="settings-version">
          <span>PLATFORM</span>
          <strong>LOGIX v1.0</strong>
        </div>

      </section>

      <footer className="dashboard-footer">
        <span>LOGIX System Control</span>

        <span>
          Platform Configuration <b>•</b> Data Services <b>•</b>{' '}
          Risk Intelligence
        </span>
      </footer>

    </div>
  )
}