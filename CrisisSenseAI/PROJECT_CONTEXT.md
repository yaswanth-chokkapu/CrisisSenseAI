# 🚨 Project: CrisisSense AI - Master Context
**Status:** Initialization Phase
**Tech Stack:** React Native (Expo), Firebase (Firestore/Auth), Antigravity (IDE)

## 🎯 Core Concept: "Action First, Context Second"
A dual-mode emergency app designed to minimize response time.

### 🧍 Mode 1: Self Emergency
- **Trigger:** One-tap/Long-press Red Button.
- **Action:** Immediate GPS capture + Firebase Alert + SMS/Notification.
- **Feedback:** Haptic "Heartbeat" vibration.

### 👀 Mode 2: Witness Emergency
- **Trigger:** "Report Incident" Button.
- **Action:** Auto-capture location + AI Tagging (Accident, Fire, Medical).
- **Killer Feature:** "Crowd Signal" - Detects if multiple users report the same 500m radius within 10 minutes.

## 🔑 Firebase Configuration
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAIIKQxj4z5LI0jQGLuqq8Vt6ay_87hRlg",
  authDomain: "crisissense-ai.firebaseapp.com",
  projectId: "crisissense-ai",
  storageBucket: "crisissense-ai.firebasestorage.app",
  messagingSenderId: "96511393073",
  appId: "1:96511393073:web:1d2bb6ddd4052e89270410",
  measurementId: "G-B5MLMYSVGQ"
};

## 🔒 Privacy & Compliance

### Data Collection Principles
- **Minimal Collection:** GPS location is only captured at the exact moment an SOS is triggered or a witness report is filed. No background tracking.
- **Purpose Limitation:** Location data is used solely for emergency dispatch and Crowd Signal verification within a 500m radius.
- **User Consent:** A one-time Privacy Consent Toast is shown on first launch using AsyncStorage to track acknowledgement. Users must explicitly tap "Got it — I Consent" before interacting.

### Data Retention
- Every Firestore `alerts` document includes a `deleteAt` timestamp set to **24 hours** after creation.
- Firestore TTL policies (or a scheduled Cloud Function) should be configured to auto-delete documents where `deleteAt <= now()`.
- Witness reports in `witness_reports` also follow the same 24-hour lifecycle via Crowd Signal's 15-minute query window.

### Encryption & Security
- All data is transmitted over HTTPS to Firebase (TLS in transit).
- Firestore Security Rules should restrict read/write to authenticated users only.
- A `🔒 Encrypted` badge is displayed in the app UI next to GPS status to reassure users.
- Firebase Auth uses `initializeAuth` with `AsyncStorage` persistence — no plaintext credentials stored.

### Compliance Notes
- This app handles sensitive emergency location data. Before production release, ensure:
  - A published Privacy Policy URL is linked from the app.
  - Firestore TTL is enabled on the `alerts` and `witness_reports` collections.
  - Google Play / App Store privacy nutrition labels are completed.
  - GDPR / regional data protection laws are reviewed if launching outside India.