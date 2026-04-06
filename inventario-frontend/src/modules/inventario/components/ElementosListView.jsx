import { useTranslation } from 'react-i18next'
import { Layers, Hash, Pencil, Trash2 } from 'lucide-react'

const ElementosListView = ({ elementos = [], onEdit, onDelete, disabled = false }) => {
  const { t } = useTranslation()
  if (elementos.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('common.name')}</th>
            <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('common.type')}</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">{t('common.material')}</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">{t('common.unit')}</th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {elementos.map((el) => (
            <tr key={el.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3">
                <div>
                  <span className="font-medium text-slate-900">{el.nombre}</span>
                  {el.descripcion && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{el.descripcion}</p>
                  )}
                </div>
              </td>
              <td className="px-5 py-3 text-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  el.requiere_series
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {el.requiere_series ? <Hash className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                  {el.requiere_series ? t('inventory.serialNumbers') : t('inventory.batch')}
                </span>
              </td>
              <td className="px-5 py-3 text-sm text-slate-600 hidden sm:table-cell">
                {el.material || '-'}
              </td>
              <td className="px-5 py-3 text-sm text-slate-600 hidden sm:table-cell">
                {el.unidad || '-'}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(el)}
                    disabled={disabled}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title={t('common.edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(el)}
                    disabled={disabled}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ElementosListView
