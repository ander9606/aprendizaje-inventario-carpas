// ============================================
// COMPONENTE: CategoriaPadreCard
// Tarjeta visual para cada categoría padre
// ============================================

import { useNavigate } from 'react-router-dom'
import { Folder, Plus, Edit, Trash2 } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'

/**
 * Componente CategoriaPadreCard
 * 
 * Muestra una categoría padre con:
 * - Icono y nombre de la categoría
 * - Contador de subcategorías
 * - Botón para ver subcategorías
 * - Botón para crear nueva subcategoría
 * - Botones de editar y eliminar
 * 
 * @param {Object} categoria - Objeto de categoría
 * @param {Function} onEdit - Función para editar categoría
 * @param {Function} onDelete - Función para eliminar categoría
 * @param {Function} onCreateSubcategoria - Función para crear subcategoría
 * 
 * @example
 * <CategoriaPadreCard 
 *   categoria={categoria}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onCreateSubcategoria={handleCreateSub}
 * />
 * 
 * ESTRUCTURA VISUAL:
 * ┌─────────────────────────┐
 * │ 🏕️  CARPAS              │  ← Header con icono y nombre
 * │                         │
 * │ 📁 5 subcategorías      │  ← Contador
 * │                         │
 * │ [Ver subcategorías]     │  ← Botón principal
 * │ [+ Nueva subcategoría]  │  ← Botón secundario
 * │                         │
 * │ [✏️ Editar]  [🗑️ Eliminar] │  ← Acciones
 * └─────────────────────────┘
 */
export const CategoriaPadreCard = ({ 
  categoria,
  onEdit,
  onDelete,
  onCreateSubcategoria 
}) => {
  
  // ============================================
  // HOOK: useNavigate
  // Hook de React Router para navegar entre páginas
  // ============================================
  const navigate = useNavigate()
  
  // ============================================
  // HANDLER: Navegar a subcategorías
  // ============================================
  const handleVerSubcategorias = () => {
    // Navegar a /categorias/:id
    navigate(`/categorias/${categoria.id}`)
  }
  
  // ============================================
  // HANDLER: Editar categoría
  // ============================================
  const handleEdit = (e) => {
    // Prevenir que el click se propague a la card
    e.stopPropagation()
    
    // Llamar a la función que abre el modal de edición
    if (onEdit) {
      onEdit(categoria)
    }
  }
  
  // ============================================
  // HANDLER: Eliminar categoría
  // ============================================
  const handleDelete = (e) => {
    e.stopPropagation()
    
    // Confirmar antes de eliminar
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar "${categoria.nombre}"?\n\n` +
      `Esta acción no se puede deshacer.`
    )
    
    if (confirmar && onDelete) {
      onDelete(categoria.id)
    }
  }
  
  // ============================================
  // HANDLER: Crear subcategoría
  // ============================================
  const handleCreateSubcategoria = (e) => {
    e.stopPropagation()
    
    if (onCreateSubcategoria) {
      onCreateSubcategoria(categoria.id)
    }
  }
  
  return (
    <Card 
      variant="outlined"
      className="hover:shadow-lg transition-shadow duration-200"
    >
      {/* ============================================
          HEADER: Icono y nombre de la categoría
          ============================================ */}
      <Card.Header>
        <div className="flex items-center gap-3">
          {/* Icono grande de la categoría */}
          <span className="text-4xl" role="img" aria-label="Icono de categoría">
            {categoria.icono || '📦'}
          </span>
          
          {/* Nombre de la categoría */}
          <Card.Title className="flex-1">
            {categoria.nombre}
          </Card.Title>
        </div>
        
        {/* Descripción opcional */}
        {categoria.descripcion && (
          <Card.Description>
            {categoria.descripcion}
          </Card.Description>
        )}
      </Card.Header>
      
      {/* ============================================
          CONTENT: Contador de subcategorías
          ============================================ */}
      <Card.Content>
        <div className="flex items-center gap-2 text-slate-600">
          <Folder className="w-5 h-5" />
          <span className="font-medium">
            {categoria.total_subcategorias || 0} subcategoría{categoria.total_subcategorias !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Información adicional si existe */}
        {categoria.fecha_creacion && (
          <p className="text-xs text-slate-500 mt-2">
            Creado: {new Date(categoria.fecha_creacion).toLocaleDateString('es-ES')}
          </p>
        )}
      </Card.Content>
      
      {/* ============================================
          FOOTER: Botones de acción
          ============================================ */}
      <Card.Footer className="flex flex-col gap-2">
        {/* Botón principal: Ver subcategorías */}
        <Button 
          variant="primary" 
          fullWidth
          onClick={handleVerSubcategorias}
        >
          Ver subcategorías {categoria.total_subcategorias > 0 && `(${categoria.total_subcategorias})`}
        </Button>
        
        {/* Botón secundario: Crear subcategoría */}
        <Button 
          variant="secondary" 
          fullWidth
          icon={<Plus />}
          onClick={handleCreateSubcategoria}
        >
          Nueva subcategoría
        </Button>
        
        {/* Separador visual */}
        <div className="border-t border-slate-200 my-2"></div>
        
        {/* Acciones secundarias: Editar y Eliminar */}
        <div className="flex gap-2">
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
            className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Eliminar
          </Button>
        </div>
      </Card.Footer>
    </Card>
  )
}

export default CategoriaPadreCard