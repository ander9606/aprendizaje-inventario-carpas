// src/hooks/useEmojiPicker.js

import { useEffect, useMemo, useState } from "react";

export function useEmojiPicker({
  open,
  categories,
  onSelect,
  onClose
}) {
  const [search, setSearch] = useState("");

  // Reset al abrir
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  // ESC para cerrar
  useEffect(() => {
    if (!open) return;

    const handler = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Filtro memoizado
  const filteredCategories = useMemo(() => {
    if (!search) return categories;

    const term = search.toLowerCase();
    const result = {};

    for (const [category, emojis] of Object.entries(categories)) {
      const matchCategory = category.toLowerCase().includes(term);
      const matchEmojis = emojis.filter(e =>
        e.toLowerCase().includes(term)
      );

      if (matchCategory || matchEmojis.length > 0) {
        result[category] = matchCategory ? emojis : matchEmojis;
      }
    }

    return result;
  }, [search, categories]);

  const selectEmoji = (emoji) => {
    onSelect?.(emoji);
    onClose?.();
  };

  return {
    search,
    setSearch,
    filteredCategories,
    selectEmoji
  };
}
