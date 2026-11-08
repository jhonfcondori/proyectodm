import { HealthCard } from '../components/HealthCard'
import { useHealth } from '../hooks'

const nextModules = [
  { name: 'Campañas', description: 'Crea y organiza tus campañas locales.' },
  { name: 'Sesiones', description: 'Registra sesiones y notas de juego.' },
  { name: 'Wiki', description: 'Personajes, lugares, objetos y facciones.' },
  { name: 'Combate', description: 'Iniciativa y seguimiento de encuentros.' },
]

export function HomePage() {
  const { data, error, isFetching, isLoading, refetch } = useHealth()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-amber-300">Asistente local para D&D 5e</p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">ProyectoDM</h1>
        <p className="max-w-2xl text-slate-400">
          Campañas, sesiones, wiki y herramientas de Dungeon Master. Todo se queda en tu
          ordenador.
        </p>
      </header>

      <HealthCard
        health={data}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={() => {
          void refetch()
        }}
      />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Siguientes módulos</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Fase 1</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {nextModules.map((module) => (
            <article
              key={module.name}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <h3 className="font-medium text-slate-100">{module.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{module.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-auto text-xs text-slate-600">
        ProyectoDM · datos locales · sin IA en la aplicación
      </footer>
    </main>
  )
}
