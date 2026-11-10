import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './layouts/AppLayout'

// Route-level code splitting: each page loads its own async chunk. The
// campaigns module is imported through its public index (cross-module rule).
const CampaignsPage = lazy(() =>
  import('./modules/campaigns').then((module) => ({ default: module.CampaignsPage })),
)
const CampaignDetailPage = lazy(() =>
  import('./modules/campaigns').then((module) => ({ default: module.CampaignDetailPage })),
)
const SessionsPage = lazy(() =>
  import('./modules/sessions').then((module) => ({ default: module.SessionsPage })),
)
const SessionDetailPage = lazy(() =>
  import('./modules/sessions').then((module) => ({ default: module.SessionDetailPage })),
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

function RouteFallback() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-16 text-sm text-slate-400"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-amber-300 motion-reduce:animate-none"
      />
      Cargando…
    </div>
  )
}

// react-router v7 in library mode: plain BrowserRouter + Routes + Route, no
// data router/framework mode (no loaders, actions or SSR needs).
export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/campaigns" replace />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaigns/:campaignId" element={<CampaignDetailPage />} />
            <Route path="/campaigns/:campaignId/sessions" element={<SessionsPage />} />
            <Route
              path="/campaigns/:campaignId/sessions/:sessionId"
              element={<SessionDetailPage />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
