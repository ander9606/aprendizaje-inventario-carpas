// ============================================
// CUSTOM HOOK: useUnidades
// Maneja todas las operaciones con unidades
// ============================================

import { useQuery } from '@tanstack/react-query'
import unidadesAPI from '../api/apiUnidades'

// ============================================
// HOOK PRINCIPAL: useGetUnidades
// Obtiene todas las unidades
// ============================================

export const useGetUnidades = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['unidades'],
    queryFn: unidadesAPI.obtenerTodas
  })

  return {
    unidades: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetUnidadesMasUsadas
// Obtiene las unidades más usadas
// ============================================

export const useGetUnidadesMasUsadas = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['unidades', 'mas-usadas'],
    queryFn: unidadesAPI.obtenerMasUsadas
  })

  return {
    unidades: data?.data || [],
    isLoading,
    error
  }
}
