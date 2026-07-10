# Linux Observatory

A lightweight Linux system monitoring dashboard built with **Node.js**, **Next.js**, and **SQLite** that provides real-time system insights and historical metrics visualization.

The application collects system information directly from the host machine using the `systeminformation` package and presents it through a modern web interface with live charts and alerting capabilities.

## Features

### System Information

* Hostname
* Current user
* System uptime
* Local IP address
* Operating system information
* Kernel version
* Architecture

### Resource Monitoring

* CPU usage
* Memory usage
* Disk usage
* Running processes count

### Historical Metrics

* Periodic metric collection using cron jobs
* Metrics stored in SQLite for historical analysis
* Time-series visualization for:

  * CPU usage
  * Memory usage
  * Disk usage

### Alerting System

* Configurable usage thresholds
* Automatic alerts when:

  * CPU usage exceeds 80%
  * Memory usage exceeds 80%
  * Disk usage exceeds 80%
* Historical alert tracking

### Dashboard

* Real-time system overview
* Live resource usage charts
* Historical trends
* Alert panel
* Responsive web interface

---

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Recharts

### Backend

* Node.js
* Express.js
* Cron jobs for metric collection

### Database

* SQLite

### System Metrics

* systeminformation

---

## Requirements

* Node.js **20 or higher**
* npm **10 or higher**
* Linux operating system (tested on Ubuntu Server)

Verify your Node version:

```bash
node -v
```

Expected output:

```text
v20.x.x
```

or newer.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Arjunson/Ubuntu-Server.git
cd linux-observatory
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

---

## Running the Application

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Backend API:

```text
http://localhost:3001
```

---

## Alert Thresholds

Default thresholds:

| Metric       | Threshold |
| ------------ | --------- |
| CPU Usage    | 80%       |
| Memory Usage | 80%       |
| Disk Usage   | 80%       |

Alerts are generated whenever a threshold is exceeded and remain active until the metric returns to a healthy state.

---

## Future Improvements

* Multi-server monitoring
* Docker container metrics
* Service monitoring
* Email notifications
* Telegram notifications
* Slack integration
* Authentication and user management
* Server-to-server monitoring agents
* Prometheus exporter support

---

## Screen Shot

<img width="1470" height="785" alt="image" src="https://github.com/user-attachments/assets/cffbdc1b-597f-40b5-b4d8-a4c1cd3bc904" />


---

## License

MIT License
