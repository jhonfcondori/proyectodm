import { NavLink, Outlet, Link } from 'react-router'
import { deriveHealthBadge, StatusBadge, useHealth } from '../modules/health'

// App shell: header with project name, main navigation, health badge in the
// corner, and the routed content inside <main id="main-content">.
export function AppLayout() {
  const { data, error, isLoading } = useHealth()
  const badge = deriveHealthBadge(data, isLoading, error)

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Saltar al contenido
      </a>

      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-6">
            <Link
              to="/campaigns"
              className="rounded-sm text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              ProyectoDM <span className="font-medium text-amber-300">· D&D 5e</span>
            </Link>
            <nav aria-label="Navegación principal">
              <ul className="flex items-center gap-1">
                <li>
                  <NavLink
                    to="/campaigns"
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                        isActive
                          ? 'bg-slate-800 text-amber-300'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`
                    }
                  >
                    Campañas
                  </NavLink>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs uppercase tracking-wide text-slate-500 sm:inline">
              Estado del sistema
            </span>
            <StatusBadge status={badge.status} label={badge.label} />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 px-5 py-4 text-center text-xs text-slate-600 sm:px-8">
        ProyectoDM · datos locales · sin IA en la aplicación
      </footer>
    </div>
  )
}
