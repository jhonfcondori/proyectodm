import { Link } from 'react-router'
import { PageHeader } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Página no encontrada" description="La ruta que buscas no existe." />
      <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
        <p className="text-sm text-slate-400">
          Comprueba la dirección o vuelve al listado de campañas.
        </p>
        <Link
          to="/campaigns"
          className="mt-6 inline-block rounded-lg border border-sky-500/40 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          Ir a campañas
        </Link>
      </section>
    </div>
  )
}
