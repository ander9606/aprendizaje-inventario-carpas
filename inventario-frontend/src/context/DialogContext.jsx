// ============================================
// CONTEXTO: DialogContext
// Sistema de diálogos de confirmación personalizados
// Reemplaza window.confirm() con modales estilizados
// ============================================

import { createContext, useContext, useState, useCallback } from 'react'
import DialogModal from '../components/common/DialogModal'

/**
 * Contexto para manejar diálogos de confirmación
 */
const DialogContext = createContext(null)

/**
 * PROVIDER: DialogProvider
 *
 * Envuelve la aplicación y proporciona funciones para mostrar diálogos.
 *
 * @example
 * // En main.jsx o App.jsx
 * <DialogProvider>
 *   <App />
 * </DialogProvider>
 */
export function DialogProvider({ children }) {
  // Estado del diálogo actual
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    tipo: 'warning',
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    onConfirm: null,
    onCancel: null,
  })

  /**
   * Muestra un diálogo de confirmación
   *
   * @param {Object} opciones - Opciones del diálogo
   * @param {string} opciones.titulo - Título del diálogo
   * @param {string} opciones.mensaje - Mensaje del diálogo
   * @param {string} opciones.tipo - Tipo: 'danger' | 'warning' | 'info' | 'success'
   * @param {string} opciones.textoConfirmar - Texto del botón confirmar
   * @param {string} opciones.textoCancelar - Texto del botón cancelar
   * @returns {Promise<boolean>} - true si confirma, false si cancela
   *
   * @example
   * const confirmado = await confirm({
   *   titulo: '¿Eliminar elemento?',
   *   mensaje: 'Esta acción no se puede deshacer.',
   *   tipo: 'danger',
   *   textoConfirmar: 'Sí, eliminar'
   * })
   *
   * if (confirmado) {
   *   await eliminar(id)
   * }
   */
  const confirm = useCallback((opciones) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        tipo: opciones.tipo || 'warning',
        titulo: opciones.titulo || '¿Confirmar acción?',
        mensaje: opciones.mensaje || '',
        textoConfirmar: opciones.textoConfirmar || 'Confirmar',
        textoCancelar: opciones.textoCancelar || 'Cancelar',
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        },
      })
    })
  }, [])

  /**
   * Cierra el diálogo actual
   */
  const closeDialog = useCallback(() => {
    if (dialogState.onCancel) {
      dialogState.onCancel()
    }
  }, [dialogState])

  return (
    <DialogContext.Provider value={{ confirm }}>
      {children}

      {/* Modal de diálogo */}
      <DialogModal
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        tipo={dialogState.tipo}
        titulo={dialogState.titulo}
        mensaje={dialogState.mensaje}
        textoConfirmar={dialogState.textoConfirmar}
        textoCancelar={dialogState.textoCancelar}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </DialogContext.Provider>
  )
}

/**
 * HOOK: useDialog
 *
 * Hook para acceder a las funciones de diálogo desde cualquier componente.
 *
 * @returns {{ confirm: Function }}
 *
 * @example
 * const { confirm } = useDialog()
 *
 * const handleEliminar = async () => {
 *   const confirmado = await confirm({
 *     titulo: '¿Eliminar?',
 *     mensaje: 'Esta acción no se puede deshacer.',
 *     tipo: 'danger'
 *   })
 *
 *   if (confirmado) {
 *     // Proceder con eliminación
 *   }
 * }
 */
export function useDialog() {
  const context = useContext(DialogContext)

  if (!context) {
    throw new Error('useDialog debe usarse dentro de un DialogProvider')
  }

  return context
}

export default DialogContext
