import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import CreateProduct from './pages/CreateProduct'
import AddSale from './pages/AddSale'
import Predict from './pages/Predict'
import Analytics from './pages/Analytics'
import Compare from './pages/Compare'
import ImportCSV from './pages/ImportCSV'
import Profile from './pages/Profile'
import Chatbot from './pages/Chatbot'
import InventoryHealth from './pages/InventoryHealth'
import Pricing from './pages/Pricing'
import PaymentResult from './pages/PaymentResult'
import NotFound from './pages/NotFound'
import Suppliers from './pages/Suppliers'
import QRScanner from './pages/QRScanner'
import Simulate from './pages/Simulate'
import StockReception from './pages/StockReception'
import CookieBanner from './components/CookieBanner'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
          </Route>
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
      </AuthProvider>
    </ThemeProvider>
  )
}
