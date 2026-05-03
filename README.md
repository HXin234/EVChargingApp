# ⚡ EV Car Charging Management App

<p align="center">
  <img src="src/assets/images/ev.png" alt="EV Charging App Banner" width="180"/>
</p>

<p align="center">
  A React Native mobile application for managing EV charging station bookings — built for Android using React Native 0.73, developed with VS Code and Android Studio.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.73-61DAFB?logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Platform-Android-green?logo=android"/>
  <img src="https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript"/>
  <img src="https://img.shields.io/badge/Database-SQLite-lightgrey?logo=sqlite"/>
  <img src="https://img.shields.io/badge/API-REST%20%2F%20Express.js-black?logo=node.js"/>
</p>

---

## 📋 Brief Summary

This project is a user-friendly **EV Charging Management Application** that makes it easy for users to book and manage their vehicle's charging sessions. Built with React Native 0.73, the app features a smooth nested navigation system combining Stack, Drawer, and Bottom Tab navigators.

Key highlights include a **real-time cost calculator** based on charging duration, a custom horizontal **Date Selector**, a **Time-Slot Grid** for precise scheduling, and a **cloud-connected booking system** via a RESTful API. The app uses a **Hybrid Storage Architecture** — SQLite for active bookings and AsyncStorage for charging history — and syncs all booking CRUD operations to a cloud-hosted Express server backed by SQLite.

> **GitHub:** [https://github.com/HXin234/EVChargingApp](https://github.com/HXin234/EVChargingApp)

---

## ✨ Key Features

### 🗺️ User Interface & Navigation
- **Intuitive Navigation System** — Smooth nested navigation combining Stack, Drawer, and Bottom Tab navigators
- **Restricted Guest Preview** — Unauthenticated users can browse stations in Guest mode; redirected to login only when attempting to book
- **Custom Header Component** — Reusable header with drawer toggle across all main screens

### 🔌 Station Browsing & Booking Management
- **Dynamic Station Browsing** — Search bar and availability toggle filter to display only stations with open slots
- **Interactive Booking Interface** — Custom horizontal Date Selector, Time-Slot Grid, and Duration Stepper
- **Real-Time Cost Calculator** — Booking Summary box auto-calculates estimated energy (kWh) and total price (RM) as the user adjusts duration
- **Booking Dashboard** — My Booking screen for managing active sessions: reschedule via Edit Time modal or complete via Finish Charging & Pay

### 💾 Data Persistence & History Tracking
- **Hybrid Storage Architecture** — SQLite for structured active booking data; AsyncStorage for read-only charging history receipts
- **Data Lifecycle Transition** — On payment, booking is automatically removed from SQLite and appended to AsyncStorage history
- **Transparent History Log** — Receipt-style history showing date, usage duration, calculation breakdown, and total cost

### ☁️ Cloud Connectivity & Real-Time Sync
- **Centralised Cloud Database** — All bookings synced to a cloud-hosted Express + SQLite REST API server
- **Full CRUD via REST API** — Create, Read, Update, and Delete operations performed directly against the cloud server
- **User-Scoped Bookings** — Each user's bookings are filtered by email address, ensuring data isolation between accounts

---

## 📁 Project Structure

```
EVChargingApp/
├── server/                          # Cloud server files (run separately)
│   ├── evRestfulAPIServer.js        # Express REST API server (port 5000)
│   ├── generateEvDatabase.js        # One-time DB setup script
│   └── ev_charging.sqlite           # Cloud SQLite database (auto-generated)
├── src/
│   ├── assets/images/               # App images (ev.png, login.jpg)
│   ├── components/
│   │   ├── DrawerContent.tsx        # Custom side drawer with user info
│   │   └── StationCard.tsx          # Reusable charging station card
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Stack + Drawer + Tab navigator setup
│   ├── screens/
│   │   ├── ChargingStationsScreen.tsx
│   │   ├── BookingScreen.tsx
│   │   ├── MakingBookingScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── AccountScreen.tsx
│   │   └── LoginScreen.tsx
│   └── utils/
│       ├── ApiService.js            # All REST API fetch() calls
│       ├── AuthStorage.js           # AsyncStorage session management
│       ├── Database.js              # Local SQLite CRUD operations
│       ├── config.js                # Server URL configuration
│       └── storage.ts               # AsyncStorage history helpers
├── App.tsx
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed before proceeding:

- [Node.js](https://nodejs.org/) (v18 or above)
- [Android Studio](https://developer.android.com/studio) with an AVD (Android Virtual Device) configured
- [VS Code](https://code.visualstudio.com/) (recommended editor)
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup) completed

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/HXin234/EVChargingApp.git
cd EVChargingApp
```

---

### Step 2 — Install App Dependencies

```bash
npm install
```

---

### Step 3 — Set Up & Start the Cloud Server

The app connects to a local Express REST API server. Open a **new terminal** and run:

```bash
# Navigate to the server folder
cd server

# Install server dependencies (first time only)
npm install express sqlite3 cors

# Create the cloud database (run ONCE only)
node generateEvDatabase.js

# Start the REST API server (keep this terminal open)
node evRestfulAPIServer.js
```

You should see:
```
================================================
 EV Charging REST API server running on port 5000
================================================
```

> ⚠️ **Keep this terminal open** while using the app. The server must be running for cloud sync to work.

---

### Step 4 — Configure Server URL

Open `src/utils/config.js`:

```js
const config = {
  apiBaseUrl: 'http://10.0.2.2:5000',   // Android Emulator (default)
  // apiBaseUrl: 'http://192.168.x.x:5000', // Physical device — replace with your PC's local IP
};
```

> 📱 If testing on a **physical Android device**, replace `10.0.2.2` with your PC's local IP address (e.g. `192.168.1.x`).

---

### Step 5 — Start Metro Bundler

Open another terminal in the project root:

```bash
npm start
```

---

### Step 6 — Launch the App on Android

Open a **third terminal** in the project root:

```bash
npm run android
```

> Make sure your Android Emulator is running in Android Studio before executing this command.

---

### Summary — 3 Terminals Required

| Terminal | Location | Command |
|----------|----------|---------|
| Terminal 1 | `EVChargingApp/server/` | `node evRestfulAPIServer.js` |
| Terminal 2 | `EVChargingApp/` | `npm start` |
| Terminal 3 | `EVChargingApp/` | `npm run android` |

---

## ☁️ Cloud Connectivity

The app uses a **Web-based RESTful API** built with **Express.js** and **SQLite** for cloud connectivity.

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/bookings?email=xxx` | Get all bookings for the logged-in user |
| `GET` | `/api/bookings/:id` | Get a specific booking by ID |
| `POST` | `/api/bookings` | Create a new booking |
| `PUT` | `/api/bookings/:id` | Update booking time/duration |
| `DELETE` | `/api/bookings/:id` | Delete a booking |

### How It Works in the App

- **Make a Booking** → `POST /api/bookings` (syncs to cloud after local SQLite save)
- **My Booking screen loads** → `GET /api/bookings?email=xxx` (fetches user-specific bookings)
- **Edit Time** → `PUT /api/bookings/:id` (updates time on cloud)
- **Cancel / Finish & Pay** → `DELETE /api/bookings/:id` (removes from cloud)

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React Native 0.73 |
| Language | TypeScript / JavaScript |
| IDE | VS Code + Android Studio |
| Navigation | React Navigation (Stack, Drawer, Tab) |
| Local Storage | react-native-sqlite-storage + AsyncStorage |
| Cloud Server | Node.js + Express.js |
| Cloud Database | SQLite (via sqlite3 npm package) |
| HTTP Client | Fetch API (via ApiService.js) |
| Icons | react-native-vector-icons (FontAwesome5) |

---

## 👥 Group Members

**Group Name:** UECS3253 Wireless Application Development — Assignment Group

**Universiti Tunku Abdul Rahman (UTAR)**
Bachelor of Software Engineering (Honours)
Academic Year 2025/2026

| Name | Student ID | Practical Group | Contact |
|------|-----------|----------------|---------|
| Tan Hui Xin | 2302892 | P4 | [![GitHub](https://img.shields.io/badge/GitHub-HXin234-181717?logo=github)](https://github.com/HXin234) |
| Daniel Liaw Yu Chern | 2504381 | P6 | — |
| Ng Zong Hao | 2302020 | P1 | — |
| Hew Jun Sheng | 2501175 | P3 | — |

> 🏫 **Institution:** [Universiti Tunku Abdul Rahman (UTAR)](https://www.utar.edu.my)
> **Faculty:** Lee Kong Chian Faculty of Engineering and Science
> **Programme:** Bachelor of Software Engineering (Honours)

---

## 📄 License

This project was developed as part of the **UECS3253 Wireless Application Development** course assignment at UTAR. All rights reserved by the respective group members.

---

<p align="center">Made with ❤️ by Group UECS3253 · UTAR 2026</p>
