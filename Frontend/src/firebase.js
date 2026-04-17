// Firebase v9+ modular SDK
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCAzNlL5xrVnCbF5ggZ-iHzQT7Hz7cHEtI",
  authDomain: "car-claim-automation.firebaseapp.com",
  projectId: "car-claim-automation",
  storageBucket: "car-claim-automation.firebasestorage.app",
  messagingSenderId: "922516434447",
  appId: "1:922516434447:web:d07fdb5e409d74a9b67d7a",
  measurementId: "G-G04FJB58R8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics is optional – only works in browser, not SSR
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // silently skip in environments where analytics can't init
}
export { analytics };
export default app;
