import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import ViewCard from './pages/ViewCard'
import StripeReturn from './pages/StripeReturn'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/card/:cardId" element={<ViewCard />} />
            <Route path="/checkout/success" element={<StripeReturn status="success" />} />
            <Route path="/checkout/cancel" element={<StripeReturn status="cancel" />} />
          </Routes>
        </div>
      </SubscriptionProvider>
    </AuthProvider>
  )
}

export default App
