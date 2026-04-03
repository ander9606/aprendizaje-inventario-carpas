// ============================================
// COMPONENTE: CategoriaFormModal
// Modal para crear/editar Categorías Padre (Nivel 1)
// ============================================

import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import Modal from '@shared/components/Modal';
import Button from '@shared/components/Button';
import SymbolPicker from '@shared/components/picker/SymbolPicker';
import IconoCategoria from '@shared/components/IconoCategoria';

import {
  useCreateCategoria,
  useUpdateCategoria,
} from "../../hooks/useCategorias";

const CategoriaFormModal = ({
  isOpen,
  onClose,
  mode = "crear",
  categoria = null, // Aquí recibimos la categoría padre a editar
}) => {
  const { t } = useTranslation();

  // ============================================
  // ESTADO LOCAL
  // ============================================

  const [formData, setFormData] = useState({
    nombre: "",
    emoji: "📦",
  });

  const [errors, setErrors] = useState({});
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false);

  // ============================================
  // HOOKS
  // ============================================

  const { createCategoria, isLoading: isCreating } = useCreateCategoria();
  const { mutateAsync: updateCategoria, isLoading: isUpdating } =
    useUpdateCategoria();

  const isLoading = isCreating || isUpdating;

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    // Si estamos editando, llenamos el formulario
    if (mode === "editar" && categoria) {
      setFormData({
        nombre: categoria.nombre || "",
        emoji: categoria.emoji || "📦",
      });
    } else {
      // Si estamos creando, limpiamos
      setFormData({
        nombre: "",
        emoji: "📦",
      });
    }
    setErrors({});
  }, [mode, categoria, isOpen]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectSymbol = (symbol) => {
    setFormData((prev) => ({ ...prev, emoji: symbol }));
    setMostrarEmojiPicker(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = t('validation.nameRequired');
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = t('validation.nameMinLength');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    // Preparar datos (Para categoría padre, padre_id siempre es null)
    const dataToSend = {
      nombre: formData.nombre.trim(),
      emoji: formData.emoji,
      padre_id: null,
    };

    try {
      if (mode === "crear") {
        console.log("📝 Creando Categoría Padre:", dataToSend);
        await createCategoria(dataToSend);
      } else {
        console.log("📝 Actualizando Categoría Padre:", dataToSend);
        await updateCategoria({
          id: categoria.id,
          ...dataToSend,
        });
      }
      onClose();
    } catch (error) {
      console.error("❌ Error:", error);
      const mensajeError =
        error.response?.data?.mensaje || t('messages.error.saveCategory');
      setErrors({ submit: mensajeError });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ nombre: "", emoji: "📦" });
      setErrors({});
      onClose();
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={mode === "crear" ? `🆕 ${t('inventory.newCategory')}` : `✏️ ${t('inventory.editCategory')}`}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">{errors.submit}</p>
            </div>
          )}

          {/* Campo Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              // 👇 Cambiamos el placeholder para que tenga sentido
              placeholder="Ej: Carpas, Mobiliario, Iluminación..."
              disabled={isLoading}
              className={`
                w-full px-4 py-2.5 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100
                ${
                  errors.nombre
                    ? "border-red-300 bg-red-50"
                    : "border-slate-300"
                }
              `}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          {/* Campo Icono */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Icono
            </label>

            <button
              type="button"
              onClick={() => setMostrarEmojiPicker(true)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg 
               flex items-center gap-3 hover:bg-slate-50"
            >
              <IconoCategoria value={formData.emoji} className="text-3xl" />
              <span className="text-slate-600">
                Haz clic para cambiar el icono
              </span>
            </button>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
              fullWidth
            >
              {mode === "crear" ? "Crear Categoría" : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </Modal>

      {mostrarEmojiPicker && (
        <SymbolPicker
          open={mostrarEmojiPicker}
          value={formData.emoji}
          onSelect={handleSelectSymbol}
          onClose={() => setMostrarEmojiPicker(false)}
        />
      )}
    </>
  );
};

export default CategoriaFormModal;
