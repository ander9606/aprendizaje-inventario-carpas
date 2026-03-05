import Spinner from '@shared/components/Spinner'
import EmptyState from '@shared/components/EmptyState'
import { Package, Layers, Hash } from 'lucide-react'

const InventarioListView = ({ elementos = [], isLoading, onGoToElemento }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    )
  }

  if (elementos.length === 0) {
    return (
      <EmptyState
        type="no-data"
        title="No hay elementos registrados"
        description="Crea categorías y elementos para verlos aquí"
        icon={Package}
      />
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoría</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subcategoría</th>
            <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
            <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cantidad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {elementos.map((el) => (
            <tr
              key={el.id}
              onClick={() => onGoToElemento(el)}
              className="hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <td className="px-6 py-3">
                <span className="font-medium text-slate-900">{el.nombre}</span>
              </td>
              <td className="px-6 py-3 text-sm text-slate-600">
                {el.categoria_padre_nombre || '-'}
              </td>
              <td className="px-6 py-3 text-sm text-slate-600">
                {el.categoria_nombre || '-'}
              </td>
              <td className="px-6 py-3 text-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  el.requiere_series
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {el.requiere_series ? <Hash className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                  {el.requiere_series ? 'Series' : 'Lotes'}
                </span>
              </td>
              <td className="px-6 py-3 text-center">
                <span className="font-semibold text-slate-900">
                  {el.cantidad_disponible || 0}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default InventarioListView
