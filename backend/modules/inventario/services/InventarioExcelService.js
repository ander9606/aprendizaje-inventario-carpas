// ============================================
// SERVICIO: Generación de Excel de Inventario
// Siguiendo patrón de CotizacionPDFService
// ============================================

const ExcelJS = require('exceljs');

// Colores del tema
const COLORES = {
    AZUL_OSCURO: 'FF1E293B',
    AZUL: 'FF2563EB',
    BLANCO: 'FFFFFFFF',
    GRIS_CLARO: 'FFF1F5F9',
    GRIS_BORDE: 'FFE2E8F0',
    VERDE: 'FF16A34A',
    AMARILLO: 'FFF59E0B',
    ROJO: 'FFDC2626'
};

class InventarioExcelService {

    /**
     * Genera un workbook de Excel con el inventario completo
     * @param {Object} datos - { inventario, resumenCategoria, resumenUbicacion }
     * @returns {ExcelJS.Workbook}
     */
    static generar(datos) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema de Inventario';
        workbook.created = new Date();

        this._crearHojaInventario(workbook, datos.inventario);
        this._crearHojaResumenCategoria(workbook, datos.resumenCategoria);
        this._crearHojaResumenUbicacion(workbook, datos.resumenUbicacion);

        return workbook;
    }

    // ============================================
    // HOJA 1: INVENTARIO DETALLADO
    // ============================================
    static _crearHojaInventario(workbook, inventario) {
        const ws = workbook.addWorksheet('Inventario Detallado', {
            views: [{ state: 'frozen', ySplit: 3 }]
        });

        // Título
        ws.mergeCells('A1:I1');
        const tituloCell = ws.getCell('A1');
        tituloCell.value = 'INVENTARIO DETALLADO';
        tituloCell.font = { bold: true, size: 14, color: { argb: COLORES.BLANCO } };
        tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL_OSCURO } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 30;

        // Fecha
        ws.mergeCells('A2:I2');
        const fechaCell = ws.getCell('A2');
        fechaCell.value = `Generado: ${new Date().toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}`;
        fechaCell.font = { size: 9, italic: true, color: { argb: 'FF64748B' } };
        fechaCell.alignment = { horizontal: 'right' };

        // Encabezados
        const headers = ['Elemento', 'Categoría', 'Subcategoría', 'Material', 'Unidad', 'Estado', 'Ubicación', 'Cantidad', 'Costo Unit.'];
        const headerRow = ws.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 10, color: { argb: COLORES.BLANCO } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = this._getBorder();
        });
        headerRow.height = 24;

        // Datos
        let totalGeneral = 0;
        inventario.forEach((item, index) => {
            const row = ws.addRow([
                item.elemento,
                item.categoria_padre,
                item.subcategoria || '-',
                item.material,
                item.unidad,
                this._capitalizarEstado(item.estado),
                item.ubicacion,
                Number(item.cantidad),
                item.costo_adquisicion ? Number(item.costo_adquisicion) : '-'
            ]);

            totalGeneral += Number(item.cantidad);

            // Filas alternas
            if (index % 2 === 0) {
                row.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.GRIS_CLARO } };
                });
            }

            // Bordes y alineación
            row.eachCell((cell, colNumber) => {
                cell.border = this._getBorder();
                cell.font = { size: 10 };
                if (colNumber === 8) {
                    cell.alignment = { horizontal: 'center' };
                    cell.numFmt = '#,##0';
                }
                if (colNumber === 9 && typeof cell.value === 'number') {
                    cell.alignment = { horizontal: 'right' };
                    cell.numFmt = '$#,##0';
                }
            });

            // Color del estado
            const estadoCell = row.getCell(6);
            estadoCell.font = { size: 10, bold: true, color: { argb: this._getColorEstado(item.estado) } };
        });

        // Fila de total
        const totalRow = ws.addRow(['', '', '', '', '', '', 'TOTAL', totalGeneral, '']);
        totalRow.eachCell((cell, colNumber) => {
            if (colNumber >= 7) {
                cell.font = { bold: true, size: 11, color: { argb: COLORES.BLANCO } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL_OSCURO } };
                cell.alignment = { horizontal: 'center' };
                cell.border = this._getBorder();
                if (colNumber === 8) cell.numFmt = '#,##0';
            }
        });

        // Anchos de columna
        ws.getColumn(1).width = 28;  // Elemento
        ws.getColumn(2).width = 20;  // Categoría
        ws.getColumn(3).width = 20;  // Subcategoría
        ws.getColumn(4).width = 16;  // Material
        ws.getColumn(5).width = 16;  // Unidad
        ws.getColumn(6).width = 16;  // Estado
        ws.getColumn(7).width = 22;  // Ubicación
        ws.getColumn(8).width = 12;  // Cantidad
        ws.getColumn(9).width = 14;  // Costo

        // Filtros automáticos
        ws.autoFilter = {
            from: { row: 3, column: 1 },
            to: { row: 3 + inventario.length, column: 9 }
        };
    }

    // ============================================
    // HOJA 2: RESUMEN POR CATEGORÍA
    // ============================================
    static _crearHojaResumenCategoria(workbook, resumen) {
        const ws = workbook.addWorksheet('Resumen por Categoría', {
            views: [{ state: 'frozen', ySplit: 3 }]
        });

        // Título
        ws.mergeCells('A1:D1');
        const tituloCell = ws.getCell('A1');
        tituloCell.value = 'RESUMEN POR CATEGORÍA';
        tituloCell.font = { bold: true, size: 14, color: { argb: COLORES.BLANCO } };
        tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL_OSCURO } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 30;

        ws.addRow([]); // Fila vacía

        // Encabezados
        const headers = ['Categoría Padre', 'Subcategoría', 'Total Elementos', 'Cantidad Total'];
        const headerRow = ws.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 10, color: { argb: COLORES.BLANCO } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = this._getBorder();
        });
        headerRow.height = 24;

        // Datos
        resumen.forEach((item, index) => {
            const row = ws.addRow([
                item.categoria_padre,
                item.subcategoria || '-',
                Number(item.total_elementos),
                Number(item.cantidad_total)
            ]);

            if (index % 2 === 0) {
                row.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.GRIS_CLARO } };
                });
            }

            row.eachCell((cell, colNumber) => {
                cell.border = this._getBorder();
                cell.font = { size: 10 };
                if (colNumber >= 3) {
                    cell.alignment = { horizontal: 'center' };
                    cell.numFmt = '#,##0';
                }
            });
        });

        ws.getColumn(1).width = 25;
        ws.getColumn(2).width = 25;
        ws.getColumn(3).width = 18;
        ws.getColumn(4).width = 18;
    }

    // ============================================
    // HOJA 3: RESUMEN POR UBICACIÓN
    // ============================================
    static _crearHojaResumenUbicacion(workbook, resumen) {
        const ws = workbook.addWorksheet('Resumen por Ubicación', {
            views: [{ state: 'frozen', ySplit: 3 }]
        });

        // Título
        ws.mergeCells('A1:E1');
        const tituloCell = ws.getCell('A1');
        tituloCell.value = 'RESUMEN POR UBICACIÓN';
        tituloCell.font = { bold: true, size: 14, color: { argb: COLORES.BLANCO } };
        tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL_OSCURO } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 30;

        ws.addRow([]); // Fila vacía

        // Encabezados
        const headers = ['Ubicación', 'Tipo', 'Series (unid.)', 'Lotes (unid.)', 'Total'];
        const headerRow = ws.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 10, color: { argb: COLORES.BLANCO } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = this._getBorder();
        });
        headerRow.height = 24;

        // Datos
        let grandTotal = 0;
        resumen.forEach((item, index) => {
            const row = ws.addRow([
                item.ubicacion,
                this._capitalizarEstado(item.tipo),
                Number(item.total_series),
                Number(item.total_lotes),
                Number(item.total)
            ]);

            grandTotal += Number(item.total);

            if (index % 2 === 0) {
                row.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.GRIS_CLARO } };
                });
            }

            row.eachCell((cell, colNumber) => {
                cell.border = this._getBorder();
                cell.font = { size: 10 };
                if (colNumber >= 3) {
                    cell.alignment = { horizontal: 'center' };
                    cell.numFmt = '#,##0';
                }
            });
        });

        // Total
        const totalRow = ws.addRow(['', '', '', 'TOTAL', grandTotal]);
        totalRow.eachCell((cell, colNumber) => {
            if (colNumber >= 4) {
                cell.font = { bold: true, size: 11, color: { argb: COLORES.BLANCO } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL_OSCURO } };
                cell.alignment = { horizontal: 'center' };
                cell.border = this._getBorder();
                if (colNumber === 5) cell.numFmt = '#,##0';
            }
        });

        ws.getColumn(1).width = 25;
        ws.getColumn(2).width = 16;
        ws.getColumn(3).width = 16;
        ws.getColumn(4).width = 16;
        ws.getColumn(5).width = 14;
    }

    // ============================================
    // HELPERS
    // ============================================

    static _getBorder() {
        return {
            top: { style: 'thin', color: { argb: COLORES.GRIS_BORDE } },
            left: { style: 'thin', color: { argb: COLORES.GRIS_BORDE } },
            bottom: { style: 'thin', color: { argb: COLORES.GRIS_BORDE } },
            right: { style: 'thin', color: { argb: COLORES.GRIS_BORDE } }
        };
    }

    static _capitalizarEstado(texto) {
        if (!texto) return '-';
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    static _getColorEstado(estado) {
        const colores = {
            'nuevo': COLORES.AZUL,
            'bueno': COLORES.VERDE,
            'mantenimiento': COLORES.AMARILLO,
            'alquilado': 'FF7C3AED',
            'dañado': COLORES.ROJO
        };
        return colores[estado] || COLORES.AZUL_OSCURO;
    }
}

module.exports = InventarioExcelService;
