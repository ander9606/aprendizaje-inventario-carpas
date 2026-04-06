// ============================================
// FORMULARIO: ELEMENTO
// Modal para crear o editar un elemento
// ============================================
import UbicacionSelector from '@shared/components/UbicacionSelector';
import ImageUpload from '@shared/components/ImageUpload';
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Modal from '@shared/components/Modal';
import Button from '@shared/components/Button';
import { useCreateElemento, useUpdateElemento, useSubirImagenElemento, useEliminarImagenElemento } from "../../hooks/useElementos";
import { useGetMateriales } from "../../hooks/useMateriales";
import { useGetUnidades } from "../../hooks/useUnidades";
import { ESTADOS } from '@shared/utils/constants';
import { Edit3, Package } from "lucide-react";
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
  const subirImagen = useSubirImagenElemento();
  const eliminarImagen = useEliminarImagenElemento();
  const mutation = isEditMode ? updateElemento : createElemento;

  // Archivo de imagen pendiente (se sube después de crear)
  const [archivoImagen, setArchivoImagen] = useState(null);

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
      newErrors.nombre = t('validation.nameRequired');
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = t('validation.nameMinLength');
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
        t('inventory.cannotChangeManagementType')
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
      toast.error(t('inventory.fixFormErrors'));
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
        onSuccess: async (response) => {
          const elementoId = isEditMode ? elemento.id : response?.data?.id;

          // Subir imagen si hay una pendiente
          if (archivoImagen && elementoId) {
            try {
              await subirImagen.mutateAsync({ elementoId, archivo: archivoImagen });
            } catch (err) {
              console.error('Error al subir imagen:', err);
              toast.warning(t('inventory.savedButImageError'));
            }
          }

          setArchivoImagen(null);

          if (!isEditMode && formData.requiere_series) {
            toast.success(t('inventory.createdAddSeries'));
            onSuccess?.(response?.data, { openSeriesModal: true });
          } else {
            toast.success(
              isEditMode ? t('inventory.elementUpdated') : t('inventory.elementCreated')
            );
            onSuccess?.();
          }
          onClose();
        },
        onError: (error) => {
          console.error("Error en la mutación:", error);
          const mensaje =
            error.response?.data?.mensaje ||
            error.message ||
            t('messages.error.generic');
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
      title={isEditMode ? t('inventory.editElementTitle') : t('inventory.newElementTitle')}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {/* CAMPO: Nombre */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('inventory.elementName')} *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder={t("inventory.elementNamePlaceholder")}
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
            {t('inventory.descriptionOptional')}
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            placeholder={t('inventory.descriptionPlaceholder')}
            rows={3}
            className="
              w-full px-4 py-2 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
          <p className="mt-1 text-xs text-slate-500">
            {t('inventory.elementsInheritIcon')}
          </p>
        </div>

        {/* CAMPO: Imagen */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('inventory.imageOptional')}
          </label>
          <ImageUpload
            imagenUrl={elemento?.imagen}
            onSubir={(archivo) => {
              if (isEditMode) {
                subirImagen.mutate(
                  { elementoId: elemento.id, archivo },
                  {
                    onSuccess: () => toast.success(t('inventory.imageUpdated')),
                    onError: () => toast.error(t('inventory.errorUploadingImage'))
                  }
                );
              } else {
                setArchivoImagen(archivo);
              }
            }}
            onEliminar={() => {
              if (isEditMode && elemento?.imagen) {
                eliminarImagen.mutate(elemento.id, {
                  onSuccess: () => toast.success(t('inventory.imageDeleted')),
                  onError: () => toast.error(t('inventory.errorDeletingImage'))
                });
              } else {
                setArchivoImagen(null);
              }
            }}
            isUploading={subirImagen.isPending}
            size="md"
          />
        </div>

        {/* CAMPO: Tipo de gestión */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            {t('inventory.managementTypeLabel')} *
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
                  {t('inventory.seriesManagement')}
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {t('inventory.individualTracking')}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {t('inventory.seriesManagementDesc')}
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
                  {t('inventory.batchManagement')}
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    {t('inventory.quantityTracking')}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {t('inventory.batchManagementDesc')}
                </p>
              </div>
            </label>
          </div>

          {isEditMode && (
            <p className="mt-2 text-sm text-amber-600 flex items-center gap-2">
              <span>⚠️</span>
              {t('inventory.cannotChangeManagementType')}
            </p>
          )}
        </div>

        {/* ============================================
            CAMPO: Material (opcional)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('inventory.materialOptional')}
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
            <option value="">{t('inventory.unspecified')}</option>
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
            {t('inventory.unitOfMeasure')}
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
            <option value="">{t('inventory.unspecified')}</option>
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
            {t('inventory.initialState')}
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
            <option value={ESTADOS.BUENO}>{t('states.good')}</option>
            <option value={ESTADOS.MANTENIMIENTO}>{t('states.maintenance')}</option>
            <option value={ESTADOS.DANADO}>{t('states.damaged')}</option>
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
          placeholder={t("inventory.locationPlaceholder")}
        />

        {/* ============================================
            CAMPO: Cantidad (para series y lotes)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('inventory.inventoryQuantity')} *
          </label>
          <input
            type="number"
            name="cantidad"
            value={formData.cantidad}
            onChange={handleCantidadChange}
            min="0"
            placeholder={t("inventory.quantityPlaceholder")}
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
              ? t('inventory.seriesQuantityHint')
              : t('inventory.batchQuantityHint')}
          </p>
        </div>

        {/* ============================================
            CAMPOS: Stock minimo, Costo y Precio (fila de 3 columnas)
            ============================================ */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('inventory.stockMinimumOptional')}
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
              {t('inventory.stockMinimumHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('inventory.acquisitionCostOptional')}
            </label>
            <input
              type="number"
              name="costo_adquisicion"
              value={formData.costo_adquisicion}
              onChange={handleInputChange}
              min="0"
              max="9999999.99"
              step="0.01"
              placeholder="$ 0.00"
              className="
                w-full px-4 py-2 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <p className="mt-1 text-xs text-slate-500">
              {t('inventory.acquisitionCostHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('inventory.unitPriceOptional')}
            </label>
            <input
              type="number"
              name="precio_unitario"
              value={formData.precio_unitario}
              onChange={handleInputChange}
              min="0"
              max="9999999.99"
              step="0.01"
              placeholder="$ 0.00"
              className="
                w-full px-4 py-2 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <p className="mt-1 text-xs text-slate-500">
              {t('inventory.unitPriceHint')}
            </p>
          </div>
        </div>

        {/* ============================================
            CAMPO: Fecha de ingreso (opcional)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('inventory.entryDate')}
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
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending
              ? isEditMode
                ? t('inventory.saving')
                : t('inventory.creating')
              : isEditMode
              ? t('common.saveChanges')
              : t('inventory.createElement')}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default ElementoFormModal;
