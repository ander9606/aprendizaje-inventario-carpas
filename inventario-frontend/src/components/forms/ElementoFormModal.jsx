// ============================================
// FORMULARIO: ELEMENTO
// Modal para crear o editar un elemento
// ============================================
import UbicacionSelector from "../common/UbicacionSelector";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { useCreateElemento, useUpdateElemento } from "../../hooks/Useelementos";
import { useGetMateriales } from "../../hooks/Usemateriales";
import { useGetUnidades } from "../../hooks/Useunidades";
import { ESTADOS } from "../../utils/constants";
import { Edit3, Package } from "lucide-react";

/**
 * ============================================
 * COMPONENTE: ElementoFormModal
 * ============================================
 *
 * Modal simplificado para crear o editar un elemento.
 *
 * SIMPLIFICACIÓN:
 * - Solo pedimos: nombre, descripción, tipo de gestión
 * - Para LOTES: valores por defecto (cantidad=0, estado='bueno', ubicacion='Bodega')
 * - Los detalles se configuran después en la página de detalle
 */
function ElementoFormModal({
  isOpen,
  onClose,
  onSuccess,
  subcategoriaId,
  elemento = null,
}) {
  // ============================================
  // 1. DETERMINAR MODO
  // ============================================
  const isEditMode = elemento && elemento.id;

  // ============================================
  // 2. HOOKS DE DATOS
  // ============================================

  // Obtener listas de materiales y unidades para los selects
  const { materiales, isLoading: loadingMateriales } = useGetMateriales();
  const { unidades, isLoading: loadingUnidades } = useGetUnidades();

  // ============================================
  // 3. ESTADOS DEL FORMULARIO
  // ============================================
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    requiere_series: true,

    // campos de configuracion
    material_id: "",
    unidad_id: "",
    estado: ESTADOS.BUENO,
    ubicacion: "",
    fecha_ingreso: "",
    cantidad: 0,
    stock_minimo: 0,
    costo_adquisicion: "",
    precio_unitario: "",
  });

  const [errors, setErrors] = useState({});

  // ============================================
  // 3. HOOKS DE MUTATIONS
  // ============================================
  const createElemento = useCreateElemento();
  const updateElemento = useUpdateElemento();
  const mutation = isEditMode ? updateElemento : createElemento;

  // ============================================
  // 4. EFECTOS
  // ============================================
  useEffect(() => {
    if (isOpen && isEditMode) {
      setFormData({
        nombre: elemento.nombre || "",
        descripcion: elemento.descripcion || "",
        requiere_series: elemento.requiere_series ?? true,

        // campos de configuracion
        material_id: elemento.material_id ?? "",
        unidad_id: elemento.unidad_id ?? "",
        estado: elemento.estado ?? ESTADOS.BUENO,
        ubicacion: elemento.ubicacion ?? "",
        fecha_ingreso: elemento.fecha_ingreso ?? "",
        cantidad: elemento.cantidad ?? 0,
        stock_minimo: elemento.stock_minimo ?? 0,
        costo_adquisicion: elemento.costo_adquisicion ?? "",
        precio_unitario: elemento.precio_unitario ?? "",
      });
    } else if (isOpen && !isEditMode) {
      setFormData({
        nombre: "",
        descripcion: "",
        requiere_series: true,
        material_id: "",
        unidad_id: "",
        estado: ESTADOS.BUENO,
        ubicacion: "",
        fecha_ingreso: "",
        cantidad: 0,
        stock_minimo: 0,
        costo_adquisicion: "",
        precio_unitario: "",
      });
    }
    setErrors({});
  }, [isOpen, elemento, isEditMode]);

  // ============================================
  // 5. VALIDACIÓN
  // ============================================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // 6. HANDLERS
  // ============================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCantidadChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      cantidad: value === "" ? 0 : parseInt(value, 10) || 0,
    }));
    if (errors.cantidad) {
      setErrors((prev) => ({ ...prev, cantidad: undefined }));
    }
  };

  const handleTipoGestionChange = (requiereSeries) => {
    if (isEditMode) {
      toast.warning(
        "No se puede cambiar el tipo de gestión una vez creado el elemento."
      );
      return;
    }
    setFormData((prev) => ({
      ...prev,
      requiere_series: requiereSeries,
      // Mantener la cantidad al cambiar tipo de gestión
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrige los errores del formulario");
      return;
    }

    // ============================================
    // PREPARAR DATOS PARA EL BACKEND
    // ============================================
    const dataToSend = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || null,
      requiere_series: formData.requiere_series,
      material_id: formData.material_id || null,
      unidad_id: formData.unidad_id || null,
      cantidad: formData.cantidad || 0,
      stock_minimo: formData.stock_minimo || 0,
      costo_adquisicion: formData.costo_adquisicion || null,
      precio_unitario: formData.precio_unitario || null,
    };

    if (!isEditMode) {
      dataToSend.categoria_id = subcategoriaId;

      // Si es gestión por LOTES, enviar datos iniciales para crear lote
      if (!formData.requiere_series) {
        dataToSend.cantidad_inicial = formData.cantidad || 0;
        dataToSend.estado_inicial = formData.estado || ESTADOS.BUENO;
        dataToSend.ubicacion_inicial = formData.ubicacion || null;
      }
    }

    // ============================================
    // EJECUTAR MUTATION
    // ============================================
    mutation.mutate(
      isEditMode ? { id: elemento.id, ...dataToSend } : dataToSend,
      {
        onSuccess: () => {
          toast.success(
            isEditMode ? "Elemento actualizado" : "Elemento creado"
          );
          onSuccess?.();
          onClose();
        },
        onError: (error) => {
          console.error("Error en la mutación:", error);
          const mensaje =
            error.response?.data?.mensaje ||
            error.message ||
            "Error al guardar el elemento";
          toast.error(mensaje);
        },
      }
    );
  };

  // ============================================
  // 7. RENDERIZADO
  // ============================================
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Editar Elemento" : "Nuevo Elemento"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {/* CAMPO: Nombre */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nombre del elemento *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Ej: Carpa Doite 3x3"
            className={`
              w-full px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2
              ${
                errors.nombre
                  ? "border-red-300 focus:ring-red-500"
                  : "border-slate-300 focus:ring-blue-500"
              }
            `}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
          )}
        </div>

        {/* CAMPO: Descripción */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            placeholder="Descripción detallada del elemento..."
            rows={3}
            className="
              w-full px-4 py-2 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
          <p className="mt-1 text-xs text-slate-500">
            💡 Los elementos heredan el ícono de su subcategoría
          </p>
        </div>

        {/* CAMPO: Tipo de gestión */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Tipo de gestión *
          </label>

          <div className="space-y-3">
            {/* Opción: Series */}
            <label
              className={`
                flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                ${
                  formData.requiere_series
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }
                ${isEditMode ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <input
                type="radio"
                name="requiere_series"
                checked={formData.requiere_series === true}
                onChange={() => handleTipoGestionChange(true)}
                disabled={isEditMode}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  Gestión por Series
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Tracking individual
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Cada unidad tiene número de serie único. Ideal para carpas,
                  proyectores, equipos de sonido.
                </p>
              </div>
            </label>

            {/* Opción: Lotes */}
            <label
              className={`
                flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                ${
                  !formData.requiere_series
                    ? "border-purple-500 bg-purple-50"
                    : "border-slate-200 hover:border-slate-300"
                }
                ${isEditMode ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <input
                type="radio"
                name="requiere_series"
                checked={formData.requiere_series === false}
                onChange={() => handleTipoGestionChange(false)}
                disabled={isEditMode}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  Gestión por Lotes
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    Tracking por cantidad
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Gestión por cantidad agrupada. Ideal para sillas, mástiles,
                  postes, estacas.
                </p>
              </div>
            </label>
          </div>

          {isEditMode && (
            <p className="mt-2 text-sm text-amber-600 flex items-center gap-2">
              <span>⚠️</span>
              No se puede cambiar el tipo de gestión una vez creado el elemento
            </p>
          )}
        </div>

        {/* ============================================
            CAMPO: Material (opcional)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Material (opcional)
          </label>
          <select
            name="material_id"
            value={formData.material_id}
            onChange={handleInputChange}
            disabled={loadingMateriales}
            className="
              w-full px-4 py-2 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          >
            <option value="">Sin especificar</option>
            {materiales.map((material) => (
              <option key={material.id} value={material.id}>
                {material.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* ============================================
            CAMPO: Unidad de medida (opcional)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Unidad de medida (opcional)
          </label>
          <select
            name="unidad_id"
            value={formData.unidad_id}
            onChange={handleInputChange}
            disabled={loadingUnidades}
            className="
              w-full px-4 py-2 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          >
            <option value="">Sin especificar</option>
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {unidad.nombre} ({unidad.abreviatura})
              </option>
            ))}
          </select>
        </div>

        {/* ============================================
            CAMPO: Estado (opcional)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Estado inicial (opcional)
          </label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleInputChange}
            className="
              w-full px-4 py-2 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          >
            <option value={ESTADOS.NUEVO}>Nuevo</option>
            <option value={ESTADOS.BUENO}>Bueno</option>
            <option value={ESTADOS.MANTENIMIENTO}>Mantenimiento</option>
            <option value={ESTADOS.DANADO}>Dañado</option>
          </select>
        </div>

        {/* ============================================
            CAMPO: Ubicación (opcional)
            ============================================ */}
        <UbicacionSelector
          value={formData.ubicacion}
          onChange={(ubicacion) =>
            setFormData((prev) => ({ ...prev, ubicacion }))
          }
          placeholder="Ej: Bodega principal"
        />

        {/* ============================================
            CAMPO: Cantidad (para series y lotes)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cantidad en inventario *
          </label>
          <input
            type="number"
            name="cantidad"
            value={formData.cantidad}
            onChange={handleCantidadChange}
            min="0"
            placeholder="Ej: 50"
            className={`
              w-full px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2
              ${
                errors.cantidad
                  ? "border-red-300 focus:ring-red-500"
                  : "border-slate-300 focus:ring-blue-500"
              }
            `}
          />
          {errors.cantidad && (
            <p className="mt-1 text-sm text-red-600">{errors.cantidad}</p>
          )}
          <p className="mt-1 text-sm text-slate-500">
            {formData.requiere_series
              ? "Cantidad total de unidades (se crearán series después)"
              : "Número de unidades del primer lote"}
          </p>
        </div>

        {/* ============================================
            CAMPOS: Stock minimo, Costo y Precio (fila de 3 columnas)
            ============================================ */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Stock minimo (opcional)
            </label>
            <input
              type="number"
              name="stock_minimo"
              value={formData.stock_minimo}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  stock_minimo: value === "" ? 0 : parseInt(value, 10) || 0,
                }));
              }}
              min="0"
              placeholder="0"
              className="
                w-full px-4 py-2 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <p className="mt-1 text-xs text-slate-500">
              Alerta cuando el stock baje
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Costo adquisicion (opcional)
            </label>
            <input
              type="number"
              name="costo_adquisicion"
              value={formData.costo_adquisicion}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="$ 0.00"
              className="
                w-full px-4 py-2 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <p className="mt-1 text-xs text-slate-500">
              Lo que se pago por unidad
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Precio unitario (opcional)
            </label>
            <input
              type="number"
              name="precio_unitario"
              value={formData.precio_unitario}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="$ 0.00"
              className="
                w-full px-4 py-2 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <p className="mt-1 text-xs text-slate-500">
              Precio de venta/alquiler
            </p>
          </div>
        </div>

        {/* ============================================
            CAMPO: Fecha de ingreso (opcional)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fecha de ingreso (opcional)
          </label>
          <input
            type="date"
            name="fecha_ingreso"
            value={formData.fecha_ingreso}
            onChange={handleInputChange}
            className="
              w-full px-4 py-2 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        {/* ============================================
            FOOTER: Botones de acción
            ============================================ */}
        <Modal.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending
              ? isEditMode
                ? "Guardando..."
                : "Creando..."
              : isEditMode
              ? "Guardar Cambios"
              : "Crear Elemento"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default ElementoFormModal;
