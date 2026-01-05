// ============================================
// COMPONENTE: ClienteCard
// Muestra una tarjeta de cliente
// ============================================

import { User, Phone, Mail, MapPin, Edit, Trash2, FileText } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'

/**
 * ClienteCard
 *
 * Tarjeta que muestra un cliente con:
 * - Tipo de documento y número
 * - Nombre
 * - Información de contacto
 * - Botones de editar y eliminar
 *
 * @param {Object} cliente - Datos del cliente
 * @param {Function} onEdit - Callback para editar cliente
 * @param {Function} onDelete - Callback para eliminar cliente
 */
const ClienteCard = ({
  cliente,
  onEdit,
  onDelete
}) => {

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Obtener nombre legible del tipo de documento
   */
  const getNombreTipoDocumento = (tipo) => {
    const nombres = {
      CC: 'Cédula',
      NIT: 'NIT',
      CE: 'Cédula Ext.'
    }
    return nombres[tipo] || tipo
  }

  /**
   * Obtener estilo del badge según tipo de documento
   */
  const getBadgeStyle = (tipo) => {
    const estilos = {
      CC: 'bg-blue-100 text-blue-700',
      NIT: 'bg-purple-100 text-purple-700',
      CE: 'bg-green-100 text-green-700'
    }
    return estilos[tipo] || 'bg-gray-100 text-gray-700'
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleEdit = (e) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(cliente)
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()

    const confirmacion = confirm(
      `¿Estás seguro de eliminar el cliente "${cliente.nombre}"?\n\n` +
      `Esta acción no se puede deshacer.`
    )

    if (confirmacion && onDelete) {
      onDelete(cliente.id)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card
      variant="outlined"
      className={`hover:shadow-lg transition-all duration-200 ${
        !cliente.activo ? 'opacity-60' : ''
      }`}
    >
      {/* HEADER */}
      <Card.Header>
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-slate-600" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="mb-2 flex flex-wrap gap-2">
              {/* Badge: Tipo documento */}
              <span className={`
                inline-block px-2 py-1 text-xs font-medium rounded-full
                ${getBadgeStyle(cliente.tipo_documento)}
              `}>
                {getNombreTipoDocumento(cliente.tipo_documento)}
              </span>

              {/* Badge: Inactivo */}
              {!cliente.activo && (
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                  Inactivo
                </span>
              )}
            </div>

            {/* Nombre */}
            <Card.Title className="truncate">
              {cliente.nombre}
            </Card.Title>

            {/* Número documento */}
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <FileText className="w-3 h-3" />
              {cliente.numero_documento}
            </p>
          </div>
        </div>
      </Card.Header>

      {/* CONTENT */}
      <Card.Content>
        <div className="space-y-2 text-sm text-slate-600">
          {/* Teléfono */}
          {cliente.telefono && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{cliente.telefono}</span>
            </div>
          )}

          {/* Email */}
          {cliente.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{cliente.email}</span>
            </div>
          )}

          {/* Ciudad */}
          {cliente.ciudad && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{cliente.ciudad}</span>
            </div>
          )}
        </div>
      </Card.Content>

      {/* FOOTER */}
      <Card.Footer>
        <div className="flex gap-2 justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={handleEdit}
            className="flex-1"
          >
            Editar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
            className="flex-1"
          >
            Eliminar
          </Button>
        </div>
      </Card.Footer>
    </Card>
  )
}

export default ClienteCard
