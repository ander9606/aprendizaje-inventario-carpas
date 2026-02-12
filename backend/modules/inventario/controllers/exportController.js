// ============================================
// CONTROLADOR: EXPORTACIÓN DE INVENTARIO
// ============================================

const ExportModel = require('../models/ExportModel');
const InventarioExcelService = require('../services/InventarioExcelService');
const logger = require('../../../utils/logger');

// ============================================
// EXPORTAR INVENTARIO A EXCEL
// ============================================

exports.exportarExcel = async (req, res, next) => {
    try {
        logger.info('exportController.exportarExcel', 'Generando exportación Excel del inventario');

        // Obtener todos los datos en paralelo
        const [inventario, resumenCategoria, resumenUbicacion] = await Promise.all([
            ExportModel.obtenerInventarioCompleto(),
            ExportModel.obtenerResumenPorCategoria(),
            ExportModel.obtenerResumenPorUbicacion()
        ]);

        // Generar workbook
        const workbook = InventarioExcelService.generar({
            inventario,
            resumenCategoria,
            resumenUbicacion
        });

        // Nombre del archivo con fecha
        const fecha = new Date().toISOString().split('T')[0];
        const filename = `inventario_${fecha}.xlsx`;

        // Headers para descarga
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        );

        // Escribir directamente al response stream
        await workbook.xlsx.write(res);
        res.end();

        logger.info('exportController.exportarExcel', 'Excel generado exitosamente', {
            filas: inventario.length,
            filename
        });
    } catch (error) {
        logger.error('exportController.exportarExcel', error);
        next(error);
    }
};
