import { useState } from 'react'
import Spinner from '@shared/components/Spinner'
import EmptyState from '@shared/components/EmptyState'
import { Package, Eye, Edit, Trash2 } from 'lucide-react'
import ModalVerEstados from './ModalVerEstados'

const InventarioListView = ({ elementos = [], isLoading, onGoToElemento }) => {
  const [elementoModal, setElementoModal] = useState(null)

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
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-[13px] font-semibold text-slate-500">Elemento</th>
              <th className="text-left px-3 py-3 text-[13px] font-semibold text-slate-500" style={{ width: 180 }}>Categoría</th>
              <th className="text-left px-3 py-3 text-[13px] font-semibold text-slate-500" style={{ width: 160 }}>Subcategoría</th>
              <th className="text-left px-3 py-3 text-[13px] font-semibold text-slate-500" style={{ width: 100 }}>Cantidad</th>
              <th className="text-left px-3 py-3 text-[13px] font-semibold text-slate-500" style={{ width: 150 }}>Estado</th>
              <th className="text-center px-3 py-3 text-[13px] font-semibold text-slate-500" style={{ width: 100 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {elementos.map((el) => {
              const emoji = el.categoria_padre_emoji || el.categoria_emoji || '📦'
              return (
                <tr
                  key={el.id}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {/* Elemento: emoji + nombre */}
                  <td className="px-4 py-2.5">
                    <div
                      className="flex items-center gap-2.5 cursor-pointer"
                      onClick={() => onGoToElemento(el)}
                    >
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-base">{emoji}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {el.nombre}
                      </span>
                    </div>
                  </td>

                  {/* Categoría como badge */}
                  <td className="px-3 py-2.5">
                    <span className="inline-block bg-blue-50 text-blue-600 rounded-md px-2 py-1 text-xs font-medium">
                      {el.categoria_padre_nombre || '-'}
                    </span>
                  </td>

                  {/* Subcategoría */}
                  <td className="px-3 py-2.5 text-[13px] text-slate-600">
                    {el.categoria_nombre || '-'}
                  </td>

                  {/* Cantidad */}
                  <td className="px-3 py-2.5">
                    <span className="text-sm font-semibold text-slate-900">
                      {el.cantidad_disponible || el.cantidad || 0}
                    </span>
                  </td>

                  {/* Estado: botón "Ver estados" */}
                  <td className="px-3 py-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setElementoModal(el)
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 text-blue-600 text-xs font-medium hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver estados
                    </button>
                  </td>

                  {/* Acciones: edit + delete */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onGoToElemento(el)
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Ver Estados */}
      <ModalVerEstados
        isOpen={!!elementoModal}
        onClose={() => setElementoModal(null)}
        elemento={elementoModal}
      />
    </>
  )
}

export default InventarioListView
