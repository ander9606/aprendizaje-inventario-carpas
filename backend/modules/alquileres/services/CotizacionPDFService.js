// ============================================
// SERVICIO: Generación de PDF de Cotización
// Usa PDFKit para crear documentos profesionales
// ============================================

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

class CotizacionPDFService {

  /**
   * Genera un PDF de cotización y lo devuelve como stream
   * @param {Object} cotizacion - Cotización completa (con productos, transporte, descuentos)
   * @param {Object} empresa - Datos de la empresa desde configuración
   * @returns {PDFDocument} Stream del PDF
   */
  static generar(cotizacion, empresa) {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
      info: {
        Title: `Cotización #${cotizacion.id}`,
        Author: empresa.nombre || 'Sistema de Alquileres',
        Subject: `Cotización para ${cotizacion.cliente_nombre}`,
      }
    });

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // ---- ENCABEZADO ----
    this._renderEncabezado(doc, cotizacion, empresa, pageWidth);

    // ---- DATOS DEL CLIENTE ----
    this._renderCliente(doc, cotizacion, pageWidth);

    // ---- DATOS DEL EVENTO ----
    this._renderEvento(doc, cotizacion, pageWidth);

    // ---- TABLA DE PRODUCTOS ----
    if (cotizacion.productos && cotizacion.productos.length > 0) {
      this._renderProductos(doc, cotizacion, pageWidth);
    }

    // ---- TABLA DE TRANSPORTE ----
    if (cotizacion.transporte && cotizacion.transporte.length > 0) {
      this._renderTransporte(doc, cotizacion, pageWidth);
    }

    // ---- RESUMEN FINANCIERO ----
    this._renderResumen(doc, cotizacion, pageWidth);

    // ---- NOTAS Y CONDICIONES ----
    this._renderNotas(doc, cotizacion, empresa, pageWidth);

    // ---- PIE DE PÁGINA ----
    this._renderPie(doc, empresa);

    doc.end();
    return doc;
  }

  // ============================================
  // ENCABEZADO
  // ============================================
  static _renderEncabezado(doc, cotizacion, empresa, pageWidth) {
    const startY = doc.y;

    // Logo (si existe)
    if (empresa.logo) {
      const logoPath = path.join(__dirname, '../../../', empresa.logo);
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, doc.page.margins.left, startY, {
            width: 80,
            height: 80,
            fit: [80, 80],
          });
        } catch (e) {
          // Si falla el logo, continuar sin él
        }
      }
    }

    // Info empresa (al lado del logo o al inicio)
    const infoX = empresa.logo ? doc.page.margins.left + 95 : doc.page.margins.left;
    doc.fontSize(16).font('Helvetica-Bold')
      .text(empresa.nombre || 'Mi Empresa', infoX, startY, { width: pageWidth - 200 });

    let infoY = doc.y;
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    if (empresa.nit) {
      doc.text(`NIT: ${empresa.nit}`, infoX, infoY);
      infoY = doc.y;
    }
    if (empresa.direccion) {
      doc.text(empresa.direccion, infoX, infoY);
      infoY = doc.y;
    }
    if (empresa.telefono) {
      doc.text(`Tel: ${empresa.telefono}`, infoX, infoY);
      infoY = doc.y;
    }
    if (empresa.email) {
      doc.text(empresa.email, infoX, infoY);
    }

    // Cuadro de cotización (derecha)
    const boxX = doc.page.width - doc.page.margins.right - 150;
    const boxW = 150;
    doc.roundedRect(boxX, startY, boxW, 55, 4)
      .fillAndStroke('#2563EB', '#2563EB');

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF')
      .text('COTIZACIÓN', boxX, startY + 8, { width: boxW, align: 'center' });
    doc.fontSize(18).font('Helvetica-Bold')
      .text(`# ${cotizacion.id}`, boxX, startY + 22, { width: boxW, align: 'center' });

    // Estado
    const estadoColors = {
      pendiente: '#F59E0B',
      aprobada: '#10B981',
      rechazada: '#EF4444',
      vencida: '#6B7280'
    };
    const estadoColor = estadoColors[cotizacion.estado] || '#6B7280';
    doc.fontSize(8).fillColor(estadoColor).font('Helvetica-Bold')
      .text((cotizacion.estado || 'pendiente').toUpperCase(), boxX, startY + 44, { width: boxW, align: 'center' });

    doc.fillColor('#000000');
    doc.y = Math.max(doc.y, startY + 70);

    // Línea separadora
    doc.moveTo(doc.page.margins.left, doc.y + 5)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y + 5)
      .strokeColor('#E2E8F0').lineWidth(1).stroke();
    doc.y += 15;
  }

  // ============================================
  // DATOS DEL CLIENTE
  // ============================================
  static _renderCliente(doc, cotizacion, pageWidth) {
    const startY = doc.y;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B')
      .text('DATOS DEL CLIENTE', doc.page.margins.left, startY);
    doc.y += 5;

    const col1X = doc.page.margins.left;
    const col2X = doc.page.margins.left + pageWidth / 2;

    doc.fontSize(9).font('Helvetica').fillColor('#475569');

    const y1 = doc.y;
    doc.font('Helvetica-Bold').text('Cliente:', col1X, y1, { continued: true })
      .font('Helvetica').text(` ${cotizacion.cliente_nombre || 'N/A'}`);

    doc.font('Helvetica-Bold').text('Documento:', col2X, y1, { continued: true })
      .font('Helvetica').text(` ${cotizacion.cliente_tipo_documento || ''} ${cotizacion.cliente_numero_documento || 'N/A'}`);

    const y2 = doc.y + 3;
    doc.font('Helvetica-Bold').text('Teléfono:', col1X, y2, { continued: true })
      .font('Helvetica').text(` ${cotizacion.cliente_telefono || 'N/A'}`);

    doc.font('Helvetica-Bold').text('Email:', col2X, y2, { continued: true })
      .font('Helvetica').text(` ${cotizacion.cliente_email || 'N/A'}`);

    if (cotizacion.cliente_direccion) {
      const y3 = doc.y + 3;
      doc.font('Helvetica-Bold').text('Dirección:', col1X, y3, { continued: true })
        .font('Helvetica').text(` ${cotizacion.cliente_direccion}`);
    }

    doc.y += 10;
    doc.moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('#E2E8F0').lineWidth(0.5).stroke();
    doc.y += 10;
  }

  // ============================================
  // DATOS DEL EVENTO
  // ============================================
  static _renderEvento(doc, cotizacion, pageWidth) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B')
      .text('DATOS DEL EVENTO', doc.page.margins.left, doc.y);
    doc.y += 5;

    const col1X = doc.page.margins.left;
    const col2X = doc.page.margins.left + pageWidth / 2;

    doc.fontSize(9).font('Helvetica').fillColor('#475569');

    if (cotizacion.evento_nombre) {
      const y0 = doc.y;
      doc.font('Helvetica-Bold').text('Evento:', col1X, y0, { continued: true })
        .font('Helvetica').text(` ${cotizacion.evento_nombre}`);
    }

    const y1 = doc.y + 3;
    doc.font('Helvetica-Bold').text('Montaje:', col1X, y1, { continued: true })
      .font('Helvetica').text(` ${this._formatFecha(cotizacion.fecha_montaje)}`);

    doc.font('Helvetica-Bold').text('Evento:', col2X, y1, { continued: true })
      .font('Helvetica').text(` ${this._formatFecha(cotizacion.fecha_evento)}`);

    const y2 = doc.y + 3;
    doc.font('Helvetica-Bold').text('Desmontaje:', col1X, y2, { continued: true })
      .font('Helvetica').text(` ${this._formatFecha(cotizacion.fecha_desmontaje)}`);

    if (cotizacion.evento_ciudad) {
      doc.font('Helvetica-Bold').text('Ciudad:', col2X, y2, { continued: true })
        .font('Helvetica').text(` ${cotizacion.evento_ciudad}`);
    }

    if (cotizacion.evento_direccion) {
      const y3 = doc.y + 3;
      doc.font('Helvetica-Bold').text('Dirección:', col1X, y3, { continued: true })
        .font('Helvetica').text(` ${cotizacion.evento_direccion}`);
    }

    doc.y += 15;
  }

  // ============================================
  // TABLA DE PRODUCTOS
  // ============================================
  static _renderProductos(doc, cotizacion, pageWidth) {
    this._checkNewPage(doc, 100);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B')
      .text('PRODUCTOS / SERVICIOS', doc.page.margins.left, doc.y);
    doc.y += 8;

    // Columnas
    const cols = [
      { label: '#', width: 25, align: 'center' },
      { label: 'Descripción', width: pageWidth - 225, align: 'left' },
      { label: 'Cant.', width: 40, align: 'center' },
      { label: 'P. Unit.', width: 80, align: 'right' },
      { label: 'Subtotal', width: 80, align: 'right' },
    ];

    // Header de tabla
    let x = doc.page.margins.left;
    const headerY = doc.y;

    doc.rect(x, headerY, pageWidth, 18).fill('#F1F5F9');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');

    cols.forEach(col => {
      doc.text(col.label, x + 4, headerY + 5, { width: col.width - 8, align: col.align });
      x += col.width;
    });

    doc.y = headerY + 22;

    // Filas de productos
    doc.fontSize(8).font('Helvetica').fillColor('#1E293B');
    cotizacion.productos.forEach((prod, i) => {
      this._checkNewPage(doc, 20);
      x = doc.page.margins.left;
      const rowY = doc.y;

      // Fondo alternado
      if (i % 2 === 1) {
        doc.rect(x, rowY - 2, pageWidth, 16).fill('#F8FAFC');
        doc.fillColor('#1E293B');
      }

      doc.font('Helvetica').text(String(i + 1), x + 4, rowY, { width: cols[0].width - 8, align: 'center' });
      x += cols[0].width;

      doc.text(prod.producto_nombre || `Producto #${prod.compuesto_id}`, x + 4, rowY, { width: cols[1].width - 8 });
      x += cols[1].width;

      doc.text(String(prod.cantidad), x + 4, rowY, { width: cols[2].width - 8, align: 'center' });
      x += cols[2].width;

      doc.text(this._formatMoney(prod.precio_base), x + 4, rowY, { width: cols[3].width - 8, align: 'right' });
      x += cols[3].width;

      doc.text(this._formatMoney(prod.subtotal), x + 4, rowY, { width: cols[4].width - 8, align: 'right' });

      doc.y = rowY + 16;
    });

    // Línea inferior
    doc.moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('#CBD5E1').lineWidth(0.5).stroke();
    doc.y += 10;
  }

  // ============================================
  // TABLA DE TRANSPORTE
  // ============================================
  static _renderTransporte(doc, cotizacion, pageWidth) {
    this._checkNewPage(doc, 80);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B')
      .text('TRANSPORTE', doc.page.margins.left, doc.y);
    doc.y += 8;

    const cols = [
      { label: '#', width: 25, align: 'center' },
      { label: 'Tipo / Ciudad', width: pageWidth - 225, align: 'left' },
      { label: 'Cant.', width: 40, align: 'center' },
      { label: 'P. Unit.', width: 80, align: 'right' },
      { label: 'Subtotal', width: 80, align: 'right' },
    ];

    let x = doc.page.margins.left;
    const headerY = doc.y;

    doc.rect(x, headerY, pageWidth, 18).fill('#F1F5F9');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');

    cols.forEach(col => {
      doc.text(col.label, x + 4, headerY + 5, { width: col.width - 8, align: col.align });
      x += col.width;
    });

    doc.y = headerY + 22;

    doc.fontSize(8).font('Helvetica').fillColor('#1E293B');
    cotizacion.transporte.forEach((t, i) => {
      x = doc.page.margins.left;
      const rowY = doc.y;

      if (i % 2 === 1) {
        doc.rect(x, rowY - 2, pageWidth, 16).fill('#F8FAFC');
        doc.fillColor('#1E293B');
      }

      doc.text(String(i + 1), x + 4, rowY, { width: cols[0].width - 8, align: 'center' });
      x += cols[0].width;

      const desc = `${t.tipo_camion || 'Transporte'}${t.ciudad ? ` - ${t.ciudad}` : ''}`;
      doc.text(desc, x + 4, rowY, { width: cols[1].width - 8 });
      x += cols[1].width;

      doc.text(String(t.cantidad), x + 4, rowY, { width: cols[2].width - 8, align: 'center' });
      x += cols[2].width;

      doc.text(this._formatMoney(t.precio_unitario), x + 4, rowY, { width: cols[3].width - 8, align: 'right' });
      x += cols[3].width;

      doc.text(this._formatMoney(t.subtotal), x + 4, rowY, { width: cols[4].width - 8, align: 'right' });

      doc.y = rowY + 16;
    });

    doc.moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('#CBD5E1').lineWidth(0.5).stroke();
    doc.y += 10;
  }

  // ============================================
  // RESUMEN FINANCIERO
  // ============================================
  static _renderResumen(doc, cotizacion, pageWidth) {
    this._checkNewPage(doc, 120);

    const boxW = 250;
    const boxX = doc.page.width - doc.page.margins.right - boxW;
    let y = doc.y + 5;

    doc.fontSize(9).font('Helvetica').fillColor('#475569');

    const renderLine = (label, value, bold = false, color = '#1E293B') => {
      if (bold) doc.font('Helvetica-Bold'); else doc.font('Helvetica');
      doc.fillColor('#475569').text(label, boxX, y, { width: boxW - 90, align: 'right' });
      doc.fillColor(color).text(this._formatMoney(value), boxX + boxW - 85, y, { width: 85, align: 'right' });
      y += 16;
    };

    // Subtotal productos
    if (cotizacion.subtotal_productos > 0) {
      renderLine('Subtotal Productos:', cotizacion.subtotal_productos);
    }

    // Subtotal transporte
    if (cotizacion.subtotal_transporte > 0) {
      renderLine('Subtotal Transporte:', cotizacion.subtotal_transporte);
    }

    // Días extra
    if (cotizacion.cobro_dias_extra > 0) {
      const diasExtra = (cotizacion.dias_montaje_extra || 0) + (cotizacion.dias_desmontaje_extra || 0);
      renderLine(`Recargo días extra (${diasExtra}d × ${cotizacion.porcentaje_dias_extra}%):`, cotizacion.cobro_dias_extra);
    }

    // Subtotal
    renderLine('Subtotal:', cotizacion.subtotal, true);

    // Descuentos
    if (cotizacion.descuentos && cotizacion.descuentos.length > 0) {
      cotizacion.descuentos.forEach(d => {
        const label = d.descripcion || d.descuento_nombre || 'Descuento';
        const prefix = d.tipo === 'porcentaje' ? ` (${d.valor}%)` : '';
        renderLine(`${label}${prefix}:`, -d.monto_calculado, false, '#EF4444');
      });
    } else if (cotizacion.total_descuentos > 0) {
      renderLine('Descuentos:', -cotizacion.total_descuentos, false, '#EF4444');
    }

    // Base gravable
    if (cotizacion.valor_iva > 0) {
      renderLine('Base gravable:', cotizacion.base_gravable);
      renderLine(`IVA (${cotizacion.porcentaje_iva}%):`, cotizacion.valor_iva);
    }

    // Línea antes del total
    doc.moveTo(boxX, y).lineTo(boxX + boxW, y).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
    y += 6;

    // TOTAL
    doc.rect(boxX, y - 2, boxW, 24).fill('#2563EB');
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#FFFFFF')
      .text('TOTAL:', boxX + 10, y + 3, { width: boxW - 105, align: 'right' })
      .text(this._formatMoney(cotizacion.total), boxX + boxW - 90, y + 3, { width: 85, align: 'right' });

    doc.y = y + 30;
    doc.fillColor('#000000');
  }

  // ============================================
  // NOTAS Y CONDICIONES
  // ============================================
  static _renderNotas(doc, cotizacion, empresa, pageWidth) {
    this._checkNewPage(doc, 80);

    // Vigencia
    doc.y += 5;
    doc.fontSize(9).font('Helvetica').fillColor('#475569');

    const vigencia = cotizacion.vigencia_dias || 15;
    const fechaCreacion = cotizacion.created_at ? new Date(cotizacion.created_at) : new Date();
    const fechaVencimiento = new Date(fechaCreacion);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + vigencia);

    doc.font('Helvetica-Bold').text('Vigencia de la cotización: ', doc.page.margins.left, doc.y, { continued: true })
      .font('Helvetica').text(`${vigencia} días (válida hasta ${this._formatFecha(fechaVencimiento)})`);

    doc.y += 5;

    // Notas
    if (cotizacion.notas) {
      doc.y += 5;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B')
        .text('Notas:', doc.page.margins.left, doc.y);
      doc.fontSize(8).font('Helvetica').fillColor('#475569')
        .text(cotizacion.notas, doc.page.margins.left, doc.y, { width: pageWidth });
      doc.y += 5;
    }

    // Condiciones generales
    doc.y += 10;
    doc.moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('#E2E8F0').lineWidth(0.5).stroke();
    doc.y += 10;

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1E293B')
      .text('Condiciones:', doc.page.margins.left, doc.y);
    doc.y += 3;

    const condiciones = [
      'Los precios incluyen montaje y desmontaje dentro de los días gratis establecidos.',
      'Los días adicionales generan un recargo según el porcentaje configurado.',
      'El transporte se cotiza según la tarifa vigente al momento de la emisión.',
      'Esta cotización está sujeta a disponibilidad de inventario.',
    ];

    doc.fontSize(7).font('Helvetica').fillColor('#64748B');
    condiciones.forEach(c => {
      doc.text(`• ${c}`, doc.page.margins.left + 5, doc.y, { width: pageWidth - 10 });
      doc.y += 2;
    });
  }

  // ============================================
  // PIE DE PÁGINA
  // ============================================
  static _renderPie(doc, empresa) {
    const bottomY = doc.page.height - 30;
    doc.fontSize(7).font('Helvetica').fillColor('#94A3B8')
      .text(
        `${empresa.nombre || 'Sistema de Alquileres'} | Generado el ${this._formatFecha(new Date())}`,
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
    if (doc.y + neededSpace > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage();
    }
  }
}

module.exports = CotizacionPDFService;
