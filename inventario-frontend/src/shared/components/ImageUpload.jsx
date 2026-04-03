// ============================================
// COMPONENTE: ImageUpload
// Upload y preview de imagen reutilizable
// ============================================

import { useState, useRef } from 'react'
import { Camera, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')

/**
 * Componente reutilizable para subir/ver/eliminar imágenes
 *
 * @param {string} imagenUrl - URL relativa de la imagen actual (ej: /uploads/elementos/...)
 * @param {Function} onSubir - Callback con el archivo seleccionado
 * @param {Function} onEliminar - Callback para eliminar la imagen
 * @param {boolean} isUploading - Si está subiendo
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
function ImageUpload({
  imagenUrl,
  onSubir,
  onEliminar,
  isUploading = false,
  size = 'md',
  className = ''
}) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48 lg:w-64 lg:h-64'
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Preview local
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(file)

    onSubir(file)
  }

  const handleEliminar = () => {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onEliminar()
  }

  const displayUrl = preview || (imagenUrl ? `${BACKEND_URL}${imagenUrl}` : null)

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Contenedor de imagen */}
      <div
        className={`
          ${sizeClasses[size]} rounded-lg border-2 border-dashed
          flex items-center justify-center overflow-hidden
          transition-all cursor-pointer relative group
          ${displayUrl
            ? 'border-transparent'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50'
          }
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Imagen"
              className="w-full h-full object-cover rounded-lg"
            />
            {/* Overlay con acciones */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                title="Cambiar imagen"
              >
                <Camera className="w-4 h-4 text-slate-700" />
              </button>
              {onEliminar && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEliminar()
                  }}
                  className="p-2 bg-white/90 rounded-full hover:bg-red-50 transition-colors"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center p-2">
            {isUploading ? (
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-xs text-slate-500">{t('common.uploadImage')}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

export default ImageUpload
