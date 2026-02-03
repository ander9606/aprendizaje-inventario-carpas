// ============================================
// SERVICIO: Generación de PDF de Cotización
// Diseño compacto para una sola hoja
// ============================================

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

class CotizacionPDFService {

  static generar(cotizacion, empresa) {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 30, bottom: 30, left: 45, right: 45 },
      info: {
        Title: `Cotización #${cotizacion.id}`,
        Author: empresa.nombre || 'Sistema de Alquileres',
        Subject: `Cotización para ${cotizacion.cliente_nombre}`,
      }
    });

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;

    // ---- ENCABEZADO ----
    this._renderEncabezado(doc, cotizacion, empresa, pageWidth, left);

    // ---- CLIENTE + EVENTO (en 2 columnas) ----
    this._renderClienteEvento(doc, cotizacion, pageWidth, left);

    // ---- TABLA UNIFICADA (productos + transporte) ----
    this._renderTabla(doc, cotizacion, pageWidth, left);

    // ---- RESUMEN FINANCIERO ----
    this._renderResumen(doc, cotizacion, pageWidth, left);

    // ---- NOTAS Y CONDICIONES ----
    this._renderNotas(doc, cotizacion, empresa, pageWidth, left);

    // ---- PIE DE PÁGINA ----
    this._renderPie(doc, empresa);

    doc.end();
    return doc;
  }

  // ============================================
  // ENCABEZADO - Compacto
  // ============================================
  static _renderEncabezado(doc, cotizacion, empresa, pageWidth, left) {
    const startY = doc.y;
    let logoEndX = left;

    // Logo (si existe)
    if (empresa.logo) {
      const logoPath = path.join(__dirname, '../../../', empresa.logo);
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, left, startY, { fit: [55, 55] });
          logoEndX = left + 62;
        } catch (e) { /* continuar sin logo */ }
      }
    }

    // Info empresa
    const infoX = logoEndX;
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1E293B')
      .text(empresa.nombre || 'Mi Empresa', infoX, startY);

    doc.fontSize(7).font('Helvetica').fillColor('#666666');
    const partes = [];
    if (empresa.nit) partes.push(`NIT: ${empresa.nit}`);
    if (empresa.direccion) partes.push(empresa.direccion);
    if (empresa.telefono) partes.push(`Tel: ${empresa.telefono}`);
    if (empresa.email) partes.push(empresa.email);
    if (partes.length > 0) {
      doc.text(partes.join('  |  '), infoX, doc.y, { width: pageWidth - 160 });
    }

    // Número de cotización (derecha, sin fondo)
    const rightX = doc.page.width - doc.page.margins.right - 130;
    doc.fontSize(9).font('Helvetica').fillColor('#64748B')
      .text('COTIZACIÓN', rightX, startY, { width: 130, align: 'right' });
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1E293B')
      .text(`#${cotizacion.id}`, rightX, startY + 11, { width: 130, align: 'right' });

    // Fecha de emisión
    doc.fontSize(7).font('Helvetica').fillColor('#64748B')
      .text(`Emisión: ${this._formatFecha(cotizacion.created_at || new Date())}`, rightX, startY + 33, { width: 130, align: 'right' });

    doc.y = Math.max(doc.y, startY + 45);

    // Línea separadora
    doc.moveTo(left, doc.y + 3).lineTo(left + pageWidth, doc.y + 3)
      .strokeColor('#CBD5E1').lineWidth(0.5).stroke();
    doc.y += 9;
  }

  // ============================================
  // CLIENTE + EVENTO en 2 columnas
  // ============================================
  static _renderClienteEvento(doc, cotizacion, pageWidth, left) {
    const startY = doc.y;
    const colW = (pageWidth - 15) / 2;

    // --- Col 1: Cliente ---
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#2563EB')
      .text('CLIENTE', left, startY);

    let y = startY + 12;
    doc.fontSize(8).fillColor('#1E293B');
    doc.font('Helvetica-Bold').text(cotizacion.cliente_nombre || 'N/A', left, y);
    y = doc.y + 1;

    doc.fontSize(7).font('Helvetica').fillColor('#475569');
    if (cotizacion.cliente_tipo_documento && cotizacion.cliente_numero_documento) {
      doc.text(`${cotizacion.cliente_tipo_documento}: ${cotizacion.cliente_numero_documento}`, left, y);
      y = doc.y + 1;
    }
    if (cotizacion.cliente_telefono) {
      doc.text(`Tel: ${cotizacion.cliente_telefono}`, left, y);
      y = doc.y + 1;
    }
    if (cotizacion.cliente_email) {
      doc.text(cotizacion.cliente_email, left, y);
      y = doc.y + 1;
    }
    const col1EndY = doc.y;

    // --- Col 2: Evento ---
    const col2X = left + colW + 15;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#2563EB')
      .text('EVENTO', col2X, startY);

    y = startY + 12;
    doc.fontSize(8).fillColor('#1E293B');
    doc.font('Helvetica-Bold').text(cotizacion.evento_nombre || 'Sin nombre', col2X, y, { width: colW });
    y = doc.y + 1;

    doc.fontSize(7).font('Helvetica').fillColor('#475569');
    doc.text(`Montaje: ${this._formatFecha(cotizacion.fecha_montaje)}   Evento: ${this._formatFecha(cotizacion.fecha_evento)}   Desmontaje: ${this._formatFecha(cotizacion.fecha_desmontaje)}`, col2X, y, { width: colW });
    y = doc.y + 1;

    if (cotizacion.evento_ciudad || cotizacion.evento_direccion) {
      const ubicacion = [cotizacion.evento_ciudad, cotizacion.evento_direccion].filter(Boolean).join(' - ');
      doc.text(ubicacion, col2X, y, { width: colW });
    }

    doc.y = Math.max(col1EndY, doc.y) + 8;
  }

  // ============================================
  // TABLA UNIFICADA (productos + transporte)
  // ============================================
  static _renderTabla(doc, cotizacion, pageWidth, left) {
    const productos = cotizacion.productos || [];
    const transporte = cotizacion.transporte || [];

    if (productos.length === 0 && transporte.length === 0) return;

    // Columnas
    const cols = [
      { label: '#', width: 20, align: 'center' },
      { label: 'Descripción', width: pageWidth - 200, align: 'left' },
      { label: 'Cant.', width: 35, align: 'center' },
      { label: 'P. Unitario', width: 72, align: 'right' },
      { label: 'Subtotal', width: 73, align: 'right' },
    ];

    // Header
    let x = left;
    const headerY = doc.y;
    doc.rect(x, headerY, pageWidth, 14).fill('#1E293B');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#FFFFFF');

    cols.forEach(col => {
      doc.text(col.label, x + 3, headerY + 4, { width: col.width - 6, align: col.align });
      x += col.width;
    });

    doc.y = headerY + 16;
    let itemNum = 0;

    // Filas de productos
    doc.fontSize(7).fillColor('#1E293B');
    productos.forEach((prod, i) => {
      itemNum++;
      x = left;
      const rowY = doc.y;

      if (i % 2 === 0) {
        doc.rect(x, rowY - 1, pageWidth, 13).fill('#F8FAFC');
        doc.fillColor('#1E293B');
      }

      doc.font('Helvetica').text(String(itemNum), x + 3, rowY, { width: cols[0].width - 6, align: 'center' });
      x += cols[0].width;
      doc.text(prod.producto_nombre || `Producto #${prod.compuesto_id}`, x + 3, rowY, { width: cols[1].width - 6 });
      x += cols[1].width;
      doc.text(String(prod.cantidad), x + 3, rowY, { width: cols[2].width - 6, align: 'center' });
      x += cols[2].width;
      doc.text(this._formatMoney(prod.precio_base), x + 3, rowY, { width: cols[3].width - 6, align: 'right' });
      x += cols[3].width;
      doc.text(this._formatMoney(prod.subtotal), x + 3, rowY, { width: cols[4].width - 6, align: 'right' });

      doc.y = rowY + 13;
    });

    // Filas de transporte
    if (transporte.length > 0) {
      // Separador de sección transporte
      const sepY = doc.y;
      doc.rect(left, sepY, pageWidth, 12).fill('#EFF6FF');
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#2563EB')
        .text('Transporte', left + 23, sepY + 3, { width: pageWidth - 30 });
      doc.y = sepY + 14;

      transporte.forEach((t, i) => {
        itemNum++;
        x = left;
        const rowY = doc.y;

        if (i % 2 === 0) {
          doc.rect(x, rowY - 1, pageWidth, 13).fill('#F8FAFC');
        }
        doc.fillColor('#1E293B').font('Helvetica');

        doc.text(String(itemNum), x + 3, rowY, { width: cols[0].width - 6, align: 'center' });
        x += cols[0].width;
        const desc = `${t.tipo_camion || 'Transporte'}${t.ciudad ? ` - ${t.ciudad}` : ''}`;
        doc.text(desc, x + 3, rowY, { width: cols[1].width - 6 });
        x += cols[1].width;
        doc.text(String(t.cantidad), x + 3, rowY, { width: cols[2].width - 6, align: 'center' });
        x += cols[2].width;
        doc.text(this._formatMoney(t.precio_unitario), x + 3, rowY, { width: cols[3].width - 6, align: 'right' });
        x += cols[3].width;
        doc.text(this._formatMoney(t.subtotal), x + 3, rowY, { width: cols[4].width - 6, align: 'right' });

        doc.y = rowY + 13;
      });
    }

    // Línea inferior de tabla
    doc.moveTo(left, doc.y).lineTo(left + pageWidth, doc.y)
      .strokeColor('#CBD5E1').lineWidth(0.5).stroke();
    doc.y += 6;
  }

  // ============================================
  // RESUMEN FINANCIERO - Compacto
  // ============================================
  static _renderResumen(doc, cotizacion, pageWidth, left) {
    const boxW = 220;
    const boxX = left + pageWidth - boxW;
    let y = doc.y;

    const renderLine = (label, value, bold = false, color = '#1E293B') => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7);
      doc.fillColor('#475569').text(label, boxX, y, { width: boxW - 80, align: 'right' });
      doc.fillColor(color).text(this._formatMoney(value), boxX + boxW - 75, y, { width: 75, align: 'right' });
      y += 12;
    };

    if (cotizacion.subtotal_productos > 0) renderLine('Subtotal Productos:', cotizacion.subtotal_productos);
    if (cotizacion.subtotal_transporte > 0) renderLine('Subtotal Transporte:', cotizacion.subtotal_transporte);

    if (cotizacion.cobro_dias_extra > 0) {
      const diasExtra = (cotizacion.dias_montaje_extra || 0) + (cotizacion.dias_desmontaje_extra || 0);
      renderLine(`Recargo días extra (${diasExtra}d × ${cotizacion.porcentaje_dias_extra}%):`, cotizacion.cobro_dias_extra);
    }

    renderLine('Subtotal:', cotizacion.subtotal, true);

    if (cotizacion.descuentos && cotizacion.descuentos.length > 0) {
      cotizacion.descuentos.forEach(d => {
        const label = d.descripcion || d.descuento_nombre || 'Descuento';
        const suffix = d.tipo === 'porcentaje' ? ` (${d.valor}%)` : '';
        renderLine(`${label}${suffix}:`, -d.monto_calculado, false, '#DC2626');
      });
    } else if (cotizacion.total_descuentos > 0) {
      renderLine('Descuentos:', -cotizacion.total_descuentos, false, '#DC2626');
    }

    if (cotizacion.valor_iva > 0) {
      renderLine('Base gravable:', cotizacion.base_gravable);
      renderLine(`IVA (${cotizacion.porcentaje_iva}%):`, cotizacion.valor_iva);
    }

    // Línea antes del total
    doc.moveTo(boxX, y).lineTo(boxX + boxW, y).strokeColor('#1E293B').lineWidth(1).stroke();
    y += 4;

    // TOTAL - solo texto, sin fondo
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B')
      .text('TOTAL:', boxX, y, { width: boxW - 80, align: 'right' })
      .text(this._formatMoney(cotizacion.total), boxX + boxW - 80, y, { width: 80, align: 'right' });

    doc.y = y + 18;
    doc.fillColor('#000000');
  }

  // ============================================
  // NOTAS Y CONDICIONES - Compacto
  // ============================================
  static _renderNotas(doc, cotizacion, empresa, pageWidth, left) {
    // Línea separadora
    doc.moveTo(left, doc.y).lineTo(left + pageWidth, doc.y)
      .strokeColor('#E2E8F0').lineWidth(0.5).stroke();
    doc.y += 6;

    // Vigencia + Notas en una línea
    const vigencia = cotizacion.vigencia_dias || 15;
    const fechaCreacion = cotizacion.created_at ? new Date(cotizacion.created_at) : new Date();
    const fechaVencimiento = new Date(fechaCreacion);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + vigencia);

    doc.fontSize(7).fillColor('#475569');
    doc.font('Helvetica-Bold').text('Vigencia: ', left, doc.y, { continued: true })
      .font('Helvetica').text(`${vigencia} días (válida hasta ${this._formatFecha(fechaVencimiento)}). Cotización sujeta a disponibilidad.`);

    if (cotizacion.notas) {
      doc.y += 3;
      doc.font('Helvetica-Bold').text('Notas: ', left, doc.y, { continued: true })
        .font('Helvetica').text(cotizacion.notas, { width: pageWidth });
    }

    // Condiciones
    doc.y += 6;
    doc.fontSize(6).font('Helvetica').fillColor('#94A3B8');
    const condiciones = [
      'Precios incluyen montaje/desmontaje dentro de días gratis.',
      'Días adicionales generan recargo según porcentaje configurado.',
      'Transporte cotizado según tarifa vigente al momento de emisión.',
    ];
    doc.text(condiciones.join('  •  '), left, doc.y, { width: pageWidth });
  }

  // ============================================
  // PIE DE PÁGINA
  // ============================================
  static _renderPie(doc, empresa) {
    const bottomY = doc.page.height - 22;
    doc.fontSize(6).font('Helvetica').fillColor('#94A3B8')
      .text(
        `${empresa.nombre || 'Sistema de Alquileres'} | Generado: ${this._formatFecha(new Date())}`,
        doc.page.margins.left,
        bottomY,
        { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: 'center' }
      );
  }

  // ============================================
  // HELPERS
  // ============================================
  static _formatMoney(value) {
    const num = Number(value) || 0;
    return `$ ${num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  static _formatFecha(fecha) {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  static _checkNewPage(doc, neededSpace) {
    if (doc.y + neededSpace > doc.page.height - doc.page.margins.bottom - 30) {
      doc.addPage();
    }
  }
}

module.exports = CotizacionPDFService;
