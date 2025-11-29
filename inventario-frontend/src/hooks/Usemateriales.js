// ============================================
// CUSTOM HOOK: useMateriales
// Maneja todas las operaciones con materiales
// ============================================

import { useQuery } from '@tantml:invoke>
import materialesAPI from '../api/apiMateriales'

// ============================================
// HOOK PRINCIPAL: useGetMateriales
// Obtiene todos los materiales
// ============================================

export const useGetMateriales = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['materiales'],
    queryFn: materialesAPI.obtenerTodos
  })

  return {
    materiales: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetMaterialesMasUsados
// Obtiene los materiales más usados
// ============================================

export const useGetMaterialesMasUsados = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['materiales', 'mas-usados'],
    queryFn: materialesAPI.obtenerMasUsados
  })

  return {
    materiales: data?.data || [],
    isLoading,
    error
  }
}
