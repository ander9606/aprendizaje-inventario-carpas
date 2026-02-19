// ============================================
// CONSTANTES: Estados del módulo de operaciones
// Fuente única de verdad para todos los estados
// ============================================

const ESTADOS_ORDEN = {
    PENDIENTE: 'pendiente',
    CONFIRMADO: 'confirmado',
    EN_PREPARACION: 'en_preparacion',
    EN_RUTA: 'en_ruta',
    EN_SITIO: 'en_sitio',
    EN_PROCESO: 'en_proceso',
    EN_RETORNO: 'en_retorno',
    DESCARGUE: 'descargue',
    COMPLETADO: 'completado',
    CANCELADO: 'cancelado'
};

const ESTADOS_ORDEN_LISTA = Object.values(ESTADOS_ORDEN);

const TIPOS_ORDEN = {
    MONTAJE: 'montaje',
    DESMONTAJE: 'desmontaje'
};

const ESTADOS_ALQUILER = {
    BORRADOR: 'borrador',
    PROGRAMADO: 'programado',
    ACTIVO: 'activo',
    FINALIZADO: 'finalizado',
    CANCELADO: 'cancelado'
};

const ESTADOS_SERIE = {
    BUENO: 'bueno',
    MANTENIMIENTO: 'mantenimiento',
    ALQUILADO: 'alquilado',
    DANADO: 'dañado'
};

const ESTADOS_RETORNO = {
    BUENO: 'bueno',
    DANADO: 'dañado',
    PERDIDO: 'perdido'
};

const ESTADOS_ELEMENTO = {
    PENDIENTE: 'pendiente',
    PREPARADO: 'preparado',
    CARGADO: 'cargado',
    DESCARGADO: 'descargado',
    INSTALADO: 'instalado',
    DESMONTADO: 'desmontado',
    RETORNADO: 'retornado',
    INCIDENCIA: 'incidencia'
};

module.exports = {
    ESTADOS_ORDEN,
    ESTADOS_ORDEN_LISTA,
    TIPOS_ORDEN,
    ESTADOS_ALQUILER,
    ESTADOS_SERIE,
    ESTADOS_RETORNO,
    ESTADOS_ELEMENTO
};
