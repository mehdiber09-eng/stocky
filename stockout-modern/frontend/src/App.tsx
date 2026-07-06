import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'
import CookieBanner from './components/CookieBanner'

// Routes — chargées à la demande pour réduire le bundle initial.
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CreateProduct = lazy(() => import('./pages/CreateProduct'))
const AddSale = lazy(() => import('./pages/AddSale'))
const Predict = lazy(() => import('./pages/Predict'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Compare = lazy(() => import('./pages/Compare'))
const ImportCSV = lazy(() => import('./pages/ImportCSV'))
const Profile = lazy(() => import('./pages/Profile'))
const Chatbot = lazy(() => import('./pages/Chatbot'))
const InventoryHealth = lazy(() => import('./pages/InventoryHealth'))
const Pricing = lazy(() => import('./pages/Pricing'))
const PaymentResult = lazy(() => import('./pages/PaymentResult'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const QRScanner = lazy(() => import('./pages/QRScanner'))
const Simulate = lazy(() => import('./pages/Simulate'))
const StockReception = lazy(() => import('./pages/StockReception'))
const QRBatchPrint = lazy(() => import('./pages/QRBatchPrint'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ExpiringProducts = lazy(() => import('./pages/ExpiringProducts'))

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <Loader2 size={28} className="text-brand-400 animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-product" element={<CreateProduct />} />
                <Route path="/add-sale" element={<AddSale />} />
                <Route path="/predict" element={<Predict />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/import" element={<ImportCSV />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/chat" element={<Chatbot />} />
                <Route path="/inventory-health" element={<InventoryHealth />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/payment/success" element={<PaymentResult type="success" />} />
                <Route path="/payment/cancel" element={<PaymentResult type="cancel" />} />
                <Route path="/scan-qr" element={<QRScanner />} />
                <Route path="/simulate" element={<Simulate />} />
                <Route path="/stock-reception" element={<StockReception />} />
                <Route path="/qr-print" element={<QRBatchPrint />} />
                <Route path="/expiring-products" element={<ExpiringProducts />} />
              </Route>
              <Route path="/pricing" element={<Pricing />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <CookieBanner />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
