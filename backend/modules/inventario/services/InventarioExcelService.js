// ============================================
// SERVICIO: Generación de Excel de Inventario
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
    AMARILLO_CLARO: 'FFFFFBEB',
    ROJO: 'FFDC2626',
    ROJO_CLARO: 'FFFEF2F2',
    MORADO: 'FF7C3AED',
    ESMERALDA: 'FF059669'
};

class InventarioExcelService {

    /**
     * Genera un workbook de Excel con el inventario completo
     * @param {Object} datos - { inventario, resumenCategoria, resumenUbicacion, alertasStock }
     * @returns {ExcelJS.Workbook}
     */
    static generar(datos) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema de Inventario';
        workbook.created = new Date();

        this._crearHojaInventario(workbook, datos.inventario);
        this._crearHojaResumenCategoria(workbook, datos.resumenCategoria);
        this._crearHojaResumenUbicacion(workbook, datos.resumenUbicacion);
        if (datos.alertasStock && datos.alertasStock.length > 0) {
            this._crearHojaAlertasStock(workbook, datos.alertasStock);
        }

        return workbook;
    }

    // ============================================
    // HOJA 1: INVENTARIO DETALLADO
    // ============================================
    static _crearHojaInventario(workbook, inventario) {
        const ws = workbook.addWorksheet('Inventario Detallado', {
            views: [{ state: 'frozen', ySplit: 3 }]
        });

        const totalCols = 12;

        // Título
        ws.mergeCells('A1:L1');
        const tituloCell = ws.getCell('A1');
        tituloCell.value = 'INVENTARIO DETALLADO';
        tituloCell.font = { bold: true, size: 14, color: { argb: COLORES.BLANCO } };
        tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL_OSCURO } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 30;

        // Fecha
        ws.mergeCells('A2:L2');
        const fechaCell = ws.getCell('A2');
        fechaCell.value = `Generado: ${new Date().toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}`;
        fechaCell.font = { size: 9, italic: true, color: { argb: 'FF64748B' } };
        fechaCell.alignment = { horizontal: 'right' };

        // Encabezados
        const headers = [
            'Elemento', 'Tipo', 'Categoría', 'Subcategoría', 'Material', 'Unidad',
            'Estado', 'Ubicación', 'Cantidad', 'Stock Mín.', 'Costo Unit.', 'Valor Total'
        ];
        const headerRow = ws.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 10, color: { argb: COLORES.BLANCO } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = this._getBorder();
        });
        headerRow.height = 24;

        // Datos
        let totalCantidad = 0;
        let totalValor = 0;

        inventario.forEach((item, index) => {
            const cantidad = Number(item.cantidad);
            const costo = item.costo_adquisicion ? Number(item.costo_adquisicion) : null;
            const valor = costo ? cantidad * costo : null;
            const stockMin = item.stock_minimo ? Number(item.stock_minimo) : null;

            totalCantidad += cantidad;
            if (valor) totalValor += valor;

            const row = ws.addRow([
                item.elemento,
                item.tipo_tracking === 'serie' ? 'Series' : 'Lotes',
                item.categoria_padre,
                item.subcategoria || '-',
                item.material,
                item.unidad,
                this._capitalizarEstado(item.estado),
                item.ubicacion,
                cantidad,
                stockMin || '-',
                costo || '-',
                valor || '-'
            ]);

            // Filas alternas
            if (index % 2 === 0) {
                row.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.GRIS_CLARO } };
                });
            }

            // Bordes, alineación y formatos
            row.eachCell((cell, colNumber) => {
                cell.border = this._getBorder();
                cell.font = { size: 10 };

                // Tipo (col 2) - color por tipo
                if (colNumber === 2) {
                    cell.font = { size: 10, bold: true, color: { argb: item.tipo_tracking === 'serie' ? COLORES.MORADO : COLORES.ESMERALDA } };
                    cell.alignment = { horizontal: 'center' };
                }
                if (colNumber === 9) {
                    cell.alignment = { horizontal: 'center' };
                    cell.numFmt = '#,##0';
                }
                if (colNumber === 10 && typeof cell.value === 'number') {
                    cell.alignment = { horizontal: 'center' };
                    cell.numFmt = '#,##0';
                }
                if (colNumber === 11 && typeof cell.value === 'number') {
                    cell.alignment = { horizontal: 'right' };
                    cell.numFmt = '$#,##0';
                }
                if (colNumber === 12 && typeof cell.value === 'number') {
                    cell.alignment = { horizontal: 'right' };
                    cell.numFmt = '$#,##0';
                }
            });

            // Color del estado
            const estadoCell = row.getCell(7);
            estadoCell.font = { size: 10, bold: true, color: { argb: this._getColorEstado(item.estado) } };
        });

        // Fila de totales
        const totalRow = ws.addRow(['', '', '', '', '', '', '', 'TOTALES', totalCantidad, '', '', totalValor > 0 ? totalValor : '']);
        totalRow.eachCell((cell, colNumber) => {
            if (colNumber >= 8) {
                cell.font = { bold: true, size: 11, color: { argb: COLORES.BLANCO } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL_OSCURO } };
                cell.alignment = { horizontal: 'center' };
                cell.border = this._getBorder();
                if (colNumber === 9) cell.numFmt = '#,##0';
                if (colNumber === 12 && typeof cell.value === 'number') {
                    cell.numFmt = '$#,##0';
                    cell.alignment = { horizontal: 'right' };
                }
            }
        });

        // Anchos de columna
        ws.getColumn(1).width = 28;
        ws.getColumn(2).width = 10;
        ws.getColumn(3).width = 20;
        ws.getColumn(4).width = 20;
        ws.getColumn(5).width = 16;
        ws.getColumn(6).width = 16;
        ws.getColumn(7).width = 16;
        ws.getColumn(8).width = 22;
        ws.getColumn(9).width = 12;
        ws.getColumn(10).width = 12;
        ws.getColumn(11).width = 14;
        ws.getColumn(12).width = 16;

        // Filtros automáticos
        ws.autoFilter = {
            from: { row: 3, column: 1 },
            to: { row: 3 + inventario.length, column: totalCols }
        };
    }

    // ============================================
    // HOJA 2: RESUMEN POR CATEGORÍA
    // ============================================
    static _crearHojaResumenCategoria(workbook, resumen) {
        const ws = workbook.addWorksheet('Resumen por Categoría', {
            views: [{ state: 'frozen', ySplit: 3 }]
        });

        ws.mergeCells('A1:D1');
        const tituloCell = ws.getCell('A1');
        tituloCell.value = 'RESUMEN POR CATEGORÍA';
        tituloCell.font = { bold: true, size: 14, color: { argb: COLORES.BLANCO } };
        tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL_OSCURO } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 30;

        ws.addRow([]);

        const headers = ['Categoría Padre', 'Subcategoría', 'Total Elementos', 'Cantidad Total'];
        const headerRow = ws.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 10, color: { argb: COLORES.BLANCO } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = this._getBorder();
        });
        headerRow.height = 24;

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

        ws.mergeCells('A1:E1');
        const tituloCell = ws.getCell('A1');
        tituloCell.value = 'RESUMEN POR UBICACIÓN';
        tituloCell.font = { bold: true, size: 14, color: { argb: COLORES.BLANCO } };
        tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL_OSCURO } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 30;

        ws.addRow([]);

        const headers = ['Ubicación', 'Tipo', 'Series (unid.)', 'Lotes (unid.)', 'Total'];
        const headerRow = ws.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 10, color: { argb: COLORES.BLANCO } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = this._getBorder();
        });
        headerRow.height = 24;

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
    // HOJA 4: ALERTAS DE STOCK BAJO
    // ============================================
    static _crearHojaAlertasStock(workbook, alertas) {
        const ws = workbook.addWorksheet('Alertas Stock Bajo', {
            views: [{ state: 'frozen', ySplit: 3 }],
            properties: { tabColor: { argb: COLORES.ROJO } }
        });

        // Título con fondo rojo
        ws.mergeCells('A1:G1');
        const tituloCell = ws.getCell('A1');
        tituloCell.value = 'ALERTAS DE STOCK BAJO';
        tituloCell.font = { bold: true, size: 14, color: { argb: COLORES.BLANCO } };
        tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.ROJO } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 30;

        // Subtítulo
        ws.mergeCells('A2:G2');
        const subCell = ws.getCell('A2');
        subCell.value = `${alertas.length} elemento${alertas.length !== 1 ? 's' : ''} por debajo del stock mínimo — ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        subCell.font = { size: 9, italic: true, color: { argb: 'FF64748B' } };
        subCell.alignment = { horizontal: 'right' };

        // Encabezados
        const headers = ['Elemento', 'Categoría', 'Stock Mínimo', 'Stock Disponible', 'Déficit', 'Costo Unit.', 'Costo Reposición'];
        const headerRow = ws.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 10, color: { argb: COLORES.BLANCO } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.ROJO } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = this._getBorder();
        });
        headerRow.height = 24;

        // Datos
        let totalDeficit = 0;
        let totalCostoReposicion = 0;

        alertas.forEach((item, index) => {
            const deficit = Number(item.deficit);
            const costo = Number(item.costo_adquisicion);
            const costoReposicion = costo > 0 ? deficit * costo : null;

            totalDeficit += deficit;
            if (costoReposicion) totalCostoReposicion += costoReposicion;

            const row = ws.addRow([
                item.elemento,
                item.categoria,
                Number(item.stock_minimo),
                Number(item.stock_disponible),
                deficit,
                costo > 0 ? costo : '-',
                costoReposicion || '-'
            ]);

            // Fondo según severidad
            const bgColor = deficit >= Number(item.stock_minimo)
                ? COLORES.ROJO_CLARO
                : COLORES.AMARILLO_CLARO;

            row.eachCell((cell, colNumber) => {
                cell.border = this._getBorder();
                cell.font = { size: 10 };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? bgColor : COLORES.BLANCO } };

                if (colNumber >= 3 && colNumber <= 5) {
                    cell.alignment = { horizontal: 'center' };
                    cell.numFmt = '#,##0';
                }
                if (colNumber === 5) {
                    cell.font = { size: 10, bold: true, color: { argb: COLORES.ROJO } };
                }
                if (colNumber === 6 && typeof cell.value === 'number') {
                    cell.alignment = { horizontal: 'right' };
                    cell.numFmt = '$#,##0';
                }
                if (colNumber === 7 && typeof cell.value === 'number') {
                    cell.alignment = { horizontal: 'right' };
                    cell.numFmt = '$#,##0';
                    cell.font = { size: 10, bold: true, color: { argb: COLORES.ROJO } };
                }
            });
        });

        // Fila de totales
        const totalRow = ws.addRow(['', '', '', 'TOTALES', totalDeficit, '', totalCostoReposicion > 0 ? totalCostoReposicion : '']);
        totalRow.eachCell((cell, colNumber) => {
            if (colNumber >= 4) {
                cell.font = { bold: true, size: 11, color: { argb: COLORES.BLANCO } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.AZUL_OSCURO } };
                cell.alignment = { horizontal: 'center' };
                cell.border = this._getBorder();
                if (colNumber === 5) cell.numFmt = '#,##0';
                if (colNumber === 7 && typeof cell.value === 'number') {
                    cell.numFmt = '$#,##0';
                    cell.alignment = { horizontal: 'right' };
                }
            }
        });

        // Anchos
        ws.getColumn(1).width = 28;
        ws.getColumn(2).width = 22;
        ws.getColumn(3).width = 14;
        ws.getColumn(4).width = 18;
        ws.getColumn(5).width = 12;
        ws.getColumn(6).width = 14;
        ws.getColumn(7).width = 18;
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
            'disponible': COLORES.VERDE,
            'mantenimiento': COLORES.AMARILLO,
            'alquilado': COLORES.MORADO,
            'dañado': COLORES.ROJO
        };
        return colores[estado] || COLORES.AZUL_OSCURO;
    }
}

module.exports = InventarioExcelService;
