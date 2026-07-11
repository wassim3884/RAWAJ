import '../styles/globals.css';
import { useEffect } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthGuard from '../components/AuthGuard';
import { registerServiceWorker } from '../lib/push';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <AuthGuard>
              <Component {...pageProps} />
            </AuthGuard>
          </main>
          <Footer />
        </div>
        <Toaster position="top-center" />
      </AuthProvider>
    </ThemeProvider>
  );
}
