import axios, { AxiosError } from 'axios'

// Use env-driven base URL with fallback to deployed Railway backend.
// Defensive: prepend https:// if missing, strip trailing slashes.
function normalizeBaseURL(raw: string | undefined): string {
  const fallback = 'https://api.mstockpredictor.com'
  let url = (raw || fallback).trim()
  if (!url) return fallback
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  return url.replace(/\/+$/, '')
}

const baseURL = normalizeBaseURL((import.meta as any).env?.VITE_API_URL)

if (typeof window !== 'undefined') {
  // Helps debug misconfigured envs in the browser console
  // eslint-disable-next-line no-console
  console.info('[StockSense] API baseURL =', baseURL)
}

const API = axios.create({
  baseURL,
  timeout: 20000,
})

export function setToken(token: string) {
  API.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function clearToken() {
  delete API.defaults.headers.common['Authorization']
}

// Initialize token from storage on app load
const stored = localStorage.getItem('token')
if (stored) setToken(stored)

// Response interceptor — handle 401 globally
// Dispatches a custom event so AuthContext can clear state + ProtectedRoute handles navigation.
// Avoids a hard page reload.
API.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      clearToken()
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(err)
  }
)

// =====================================================
// Types
// =====================================================
export interface Product {
  id: number
  name: string
  sku: string
  lead_time_days: number
  safety_stock: number
  supplier_id: number | null
  unit_price: number | null
  cost_price: number | null
  price_currency: string
  image_url: string | null
  created_at: string
}

export interface Supplier {
  id: number
  name: string
  contact_email: string | null
  phone: string | null
  lead_time_days: number
  created_at: string
  reliability_score?: number
  product_count?: number
}

export interface StockRotationItem {
  product_id: number
  product_name: string
  sku: string
  current_stock: number
  dsi: number | null
  rotation_rate: number | null
  is_dormant: boolean
  last_sale_date: string | null
  days_since_last_sale: number | null
  sales_365d: number
}

export interface MarginItem {
  product_id: number
  product_name: string
  sku: string
  unit_price_dzd: number
  cost_price_dzd: number | null
  margin_absolute: number | null
  margin_pct: number | null
  current_stock: number
  stock_value_dzd: number
  price_currency: string
}

export interface StockMovement {
  id: number
  product_id: number
  quantity_before: number
  quantity_after: number
  change: number
  reason: string
  created_at: string
}

export interface PredictionResult {
  probability: number
  lower: number
  upper: number
  trials_used?: number
  trials_limit?: number
}

export interface SalePayload {
  product_id: number
  quantity: number
}

export interface Sale {
  id: number
  product_id: number
  quantity: number
  sold_at: string
}

export interface Inventory {
  id: number
  product_id: number
  quantity: number
  updated_at: string
}

export interface Notification {
  id: number
  product_id: number | null
  kind: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface InventoryHealthItem {
  product_id: number
  product_name: string
  sku: string
  current_stock: number
  avg_daily_sales_30d: number
  sales_30d: number
  sales_90d_total: number
  reorder_point: number
  days_of_coverage: number | null
  needs_reorder: boolean
  lead_time_days: number
  safety_stock: number
  abc_class: 'A' | 'B' | 'C'
  status: 'critical' | 'warning' | 'ok' | 'overstock'
}

export interface SalesVelocityItem {
  product_id: number
  product_name: string
  sku: string
  velocity_7d: number
  velocity_30d: number
  velocity_90d: number
  trend: 'accelerating' | 'stable' | 'decelerating'
  trend_pct: number
}

export interface BatchPredictionResult {
  results: Array<{
    product_id: number
    product_name: string
    sku: string
    probability: number
    lower: number
    upper: number
    risk: 'high' | 'medium' | 'low'
    horizon: number
  }>
  summary: {
    high: number
    medium: number
    low: number
    total: number
  }
}

// =====================================================
// API endpoints
// =====================================================
export const AuthAPI = {
  register: (email: string, password: string) =>
    API.post<{ access_token: string }>('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    API.post<{ access_token: string }>('/auth/token', { email, password }),
  me: () => API.get('/auth/me'),
  verifyEmail: (token: string) =>
    API.post<{ message: string }>('/auth/verify-email', { token }),
  resendVerification: (email: string) =>
    API.post<{ message: string }>('/auth/resend-verification', { email }),
  // OAuth — URLs de redirection (le backend gère le callback)
  oauthGoogleStart: () => `${baseURL}/auth/oauth/google/start`,
  oauthAppleStart: () => `${baseURL}/auth/oauth/apple/start`,
}

export const ProductsAPI = {
  list: () => API.get<Product[]>('/products/'),
  get: (id: number) => API.get<Product>(`/products/${id}`),
  create: (data: {
    name: string; sku: string; lead_time_days: number; safety_stock: number;
    initial_stock?: number; supplier_id?: number | null;
    unit_price?: number | null; cost_price?: number | null; price_currency?: string;
    image_url?: string | null;
  }) => API.post<Product>('/products/', data),
  update: (id: number, data: {
    name?: string; lead_time_days?: number; safety_stock?: number; supplier_id?: number | null;
    unit_price?: number | null; cost_price?: number | null; price_currency?: string;
    image_url?: string | null;
  }) => API.put<Product>(`/products/${id}`, data),
  delete: (id: number) => API.delete(`/products/${id}`),
}

export const SalesAPI = {
  list: (limit = 100) => API.get<Sale[]>(`/sales/?limit=${limit}`),
  add: (data: SalePayload) => API.post('/sales/', data),
}

export const InventoryAPI = {
  list: () => API.get<Inventory[]>('/inventory/'),
  get: (productId: number) => API.get<Inventory>(`/inventory/${productId}`),
  update: (productId: number, quantity: number) =>
    API.put<Inventory>(`/inventory/${productId}`, { quantity }),
}

export const PredictAPI = {
  run: (product_id: number, horizon: number) =>
    API.post<PredictionResult>('/predict/', { product_id, horizon }),
  batch: (horizon = 30) =>
    API.post<BatchPredictionResult>(`/predict/batch?horizon=${horizon}`),
}

export const SubscribeAPI = {
  subscribe: () => API.post('/subscribe/'),
  status: () => API.get('/subscribe/status'),
}

export const AnalyticsAPI = {
  summary: () => API.get('/analytics/summary'),
  history: (limit = 20) => API.get(`/analytics/predictions/history?limit=${limit}`),
  salesByProduct: () => API.get('/analytics/sales/by-product'),
  byRisk: () => API.get('/analytics/predictions/by-risk'),
  inventoryHealth: () => API.get<InventoryHealthItem[]>('/analytics/inventory-health'),
  salesVelocity: () => API.get<SalesVelocityItem[]>('/analytics/sales-velocity'),
}

export const ExportAPI = {
  predictionsCSV: () => API.get('/export/predictions/csv', { responseType: 'blob' }),
  salesCSV: () => API.get('/export/sales/csv', { responseType: 'blob' }),
}

export const NotificationsAPI = {
  list: (unreadOnly = false, limit = 50) =>
    API.get<Notification[]>(`/notifications/?unread_only=${unreadOnly}&limit=${limit}`),
  count: () => API.get<{ unread: number; total: number }>('/notifications/count'),
  markRead: (id: number) => API.post(`/notifications/${id}/read`),
  markAllRead: () => API.post('/notifications/read-all'),
  remove: (id: number) => API.delete(`/notifications/${id}`),
}

export const ChatAPI = {
  send: (messages: { role: string; content: string }[]) =>
    API.post<{ content: string }>('/chat/', { messages }),
}

export const SuppliersAPI = {
  list: () => API.get<Supplier[]>('/suppliers/'),
  create: (data: Omit<Supplier, 'id' | 'created_at'>) => API.post<Supplier>('/suppliers/', data),
  update: (id: number, data: Partial<Omit<Supplier, 'id' | 'created_at'>>) => API.put<Supplier>(`/suppliers/${id}`, data),
  delete: (id: number) => API.delete(`/suppliers/${id}`),
}

export const StockHistoryAPI = {
  get: (productId: number, limit = 50) => API.get<StockMovement[]>(`/stock-history/${productId}?limit=${limit}`),
}

export interface PaymentStatus {
  is_subscribed: boolean
  price_dzd: number
  price_usd: number
  price_eur: number
  chargily_enabled: boolean
  paypal_enabled: boolean
}

export const PaymentAPI = {
  status: () => API.get<PaymentStatus>('/payments/status'),
  chargilyCheckout: (method: 'edahabia' | 'cib') =>
    API.post<{ checkout_url: string; checkout_id: string }>(`/payments/chargily/checkout?method=${method}`),
  paypalCreate: () =>
    API.post<{ order_id: string; approval_url: string }>('/payments/paypal/create'),
  paypalCapture: (orderId: string) =>
    API.post<{ subscribed: boolean }>(`/payments/paypal/capture?order_id=${encodeURIComponent(orderId)}`),
}

export default API

export interface QRScanResult {
  product_id: number
  product_name: string
  sku: string
  current_stock: number
  risk_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendation: string
  alert_level: string
  lead_time_days: number
  safety_stock: number
}

export const QRScanAPI = {
  scan: (qr_data: string) => API.post<QRScanResult>('/scan_qr/', { qr_data }),
}

export interface SimulationResult {
  product_name: string
  sku: string
  current_stock: number
  base_risk: number
  simulated_risk: number
  risk_delta: number
  new_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendation: string
  business_impact: string
  stock_impact_days: number
  avg_daily_demand: number
  scenario_label: string
}

export const SimulateAPI = {
  run: (params: {
    product_id: number
    horizon: number
    demand_increase_pct: number
    supplier_delay_days: number
    event: string
  }) => API.post<SimulationResult>('/simulate/', params),
}

export interface SystemStatusData {
  status: 'SAFE' | 'WARNING' | 'CRITICAL'
  status_color: string
  message: string
  stats: {
    total_products: number
    critical_notifications: number
    warning_notifications: number
    predictions_last_hour: number
    high_risk_products_24h: number
  }
  high_risk_products: string[]
  security_events: Array<{ type: string; message: string; severity: string }>
  timestamp: string
}

export const SystemStatusAPI = {
  get: () => API.get<SystemStatusData>('/system-status/'),
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
