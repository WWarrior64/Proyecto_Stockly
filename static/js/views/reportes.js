// static/js/views/reportes.js
import { reportesService } from '/static/js/services/reportesService.js';

const { createApp } = Vue;

const app = createApp({
  delimiters: ['[[', ']]'],  // Avoid Jinja conflict
  data() {
    return {
      stats: null,
      loading: true,
      error: null
    };
  },
  async created() {
    try {
      this.stats = await reportesService.getStats();
    } catch (e) {
      console.error('Error cargando stats', e);
      this.error = e.message || 'Error cargando datos';
    } finally {
      this.loading = false;
      this.$nextTick(() => {
        this.initCharts();
      });
    }
  },
  methods: {
    initCharts() {
      if (!this.stats) return;

      // Colores fijos para donut
      const colors = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#9CA3AF', '#6366F1', '#EC4899'];

      // Donut Chart
      this.donutChart = new Chart(document.getElementById('donutChart'), {
        type: 'doughnut',
        data: {
          labels: this.stats.donut.labels,
          datasets: [{
            data: this.stats.donut.data,
            backgroundColor: colors.slice(0, this.stats.donut.labels.length)
          }]
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });

      // Bar Chart
      this.barChart = new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
          labels: this.stats.bar.labels,
          datasets: this.stats.bar.datasets.map((ds, idx) => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: colors[idx]
          }))
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

      // Line Chart
      this.lineChart = new Chart(document.getElementById('lineChart'), {
        type: 'line',
        data: {
          labels: this.stats.line.labels,
          datasets: this.stats.line.datasets.map((ds, idx) => ({
            label: ds.label,
            data: ds.data,
            borderColor: colors[idx],
            fill: false
          }))
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    },
    // Reemplaza el método downloadReport en tu reportes.js por esto:
// usa el namespace UMD de jsPDF

async downloadReport() {
  console.log('[reportes] start downloadReport (jsPDF path)');

  if (!this.stats) {
    alert('No hay datos para generar el informe.');
    return;
  }

  // asegurar que Chart instances existan
  if (!this.donutChart || !this.barChart || !this.lineChart) {
    console.warn('[reportes] charts no están listos. Intentando iniciar/esperar un poco...');
    await new Promise(r => setTimeout(r, 300));
  }

  // obtener imágenes desde charts
  let donutImg, barImg, lineImg;
  try {
    donutImg = chartToDataURLWithWhiteBg(this.donutChart, 'image/jpeg', 1.0);
    barImg   = chartToDataURLWithWhiteBg(this.barChart,   'image/jpeg', 1.0);
    lineImg  = chartToDataURLWithWhiteBg(this.lineChart,  'image/jpeg', 1.0);
  } catch (e) {
    console.warn('[reportes] error creando imagenes con fondo blanco', e);
    // fallback simples usando toBase64Image si existe
    try { donutImg = this.donutChart && this.donutChart.toBase64Image && this.donutChart.toBase64Image(); } catch(_) {}
    try { barImg   = this.barChart   && this.barChart.toBase64Image   && this.barChart.toBase64Image(); } catch(_) {}
    try { lineImg  = this.lineChart  && this.lineChart.toBase64Image  && this.lineChart.toBase64Image(); } catch(_) {}
  }


  // Chequeo básico de disponibilidad de jsPDF
  const { jsPDF } = window.jspdf || (window.jspdf = window.jspdf || {});
  if (!jsPDF && !window.jsPDF) {
    console.warn('[reportes] jsPDF no disponible en window.jspdf. Intentando fallback a html2pdf...');
    // fallback a html2pdf (si está)
    if (window.html2pdf) {
      console.log('[reportes] usando fallback html2pdf');
      return await this._downloadWithHtml2pdfFallback();
    } else {
      alert('No se encontró jsPDF ni html2pdf. Agrega las librerías en el HTML.');
      return;
    }
  }

  // crear doc
  const doc = new (window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF)({
    unit: 'pt',
    format: 'a4',
    orientation: 'portrait'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let cursorY = 40;

  // Título
  doc.setFontSize(18);
  doc.text('Reporte de Estadísticas - Stockly', margin, cursorY);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleString()}`, margin, cursorY + 16);
  cursorY += 36;

  // Indicadores: disponibilidad, valor total, edad promedio
  doc.setFontSize(11);
  doc.setTextColor(30);
  const ind = this.stats.indicators || {};
  const indicators = [
    ['Disponibilidad stock (%)', (ind.availability ?? '-')],
    ['Valor total inventario', (ind.total_value != null) ? `$ ${Number(ind.total_value).toFixed(2)}` : '-'],
    ['Edad promedio de lotes (años)', (ind.avg_age ?? '-')]
  ];

  // dibujar indicadores en línea (3 columnas)
  const colW = (pageWidth - margin * 2) / 3;
  indicators.forEach((it, idx) => {
    const x = margin + idx * colW;
    doc.setFontSize(12);
    doc.text(String(it[1]), x, cursorY);
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(String(it[0]), x, cursorY + 14);
  });
  doc.setTextColor(0);
  cursorY += 40;

  // FUNC: agregar imagen escalada manteniendo ratio
  const addImage = (imgData, maxWidthPt = pageWidth - margin * 2) => {
    if (!imgData) return 0;
    const img = new Image();
    img.src = imgData;
    // tamaño px a pt ~ 0.75 (72dpi/96dpi) — pero jsPDF acepta imagen con width en pts
    // calculamos basados en imagen natural cuando cargue, pero toBase64Image suele dar buen tamaño
    const w = Math.min(maxWidthPt, 440);
    const h = (img.naturalHeight / img.naturalWidth) * w || (w * 0.5);
    try {
      doc.addImage(imgData, 'JPEG', margin, cursorY, w, h);
    } catch (e) {
      // fallback: intentar sin especificar tamaño
      try { doc.addImage(imgData, 'JPEG', margin, cursorY); } catch (e2) { console.warn('addImage failed', e2); }
    }
    return (h + 10);
  };

  // Añadir tabla: distribución por categoría (usando autotable si disponible)
  const donut = this.stats.donut || { labels: [], data: [] };
  const totalCat = (donut.data || []).reduce((s, x) => s + (Number(x) || 0), 0) || 0;
  const catRows = (donut.labels || []).map((lab, idx) => {
    const v = Number(donut.data[idx] || 0);
    const pct = totalCat ? ((v / totalCat) * 100).toFixed(2) + '%' : '0.00%';
    return [lab, v, pct];
  });

  // si existe autotable, usarla para tablas bien formateadas
  if (doc.autoTable) {
    doc.autoTable({
      startY: cursorY,
      head: [['Categoría', 'Count', '%']],
      body: catRows,
      theme: 'striped',
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin }
    });
    cursorY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : cursorY + 80;
  } else {
    // fallback: dibujar tabla simple
    doc.setFontSize(10);
    doc.text('Distribución por Categoría', margin, cursorY);
    cursorY += 14;
    catRows.forEach(r => {
      doc.text(`${r[0]} — ${r[1]} — ${r[2]}`, margin, cursorY);
      cursorY += 12;
    });
    cursorY += 6;
  }

  // Incluir imagen del donut por debajo si hay espacio, o en nueva página
  if (donutImg) {
    if (cursorY + 220 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); cursorY = margin; }
    cursorY += addImage(donutImg);
  }

  // Top proveedores
  if (doc.autoTable) {
    const bar = this.stats.bar || { labels: [], datasets: [] };
    const barRows = [];
    for (let i=0;i<(bar.labels||[]).length;i++) {
      const label = bar.labels[i];
      const pedidosCount = (bar.datasets[0] && bar.datasets[0].data[i]) || 0;
      const qty = (bar.datasets[1] && bar.datasets[1].data[i]) || 0;
      barRows.push([label, pedidosCount, qty]);
    }
    doc.autoTable({
      startY: cursorY,
      head: [['Proveedor','Nº Pedidos','Cantidad total']],
      body: barRows,
      theme: 'striped',
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin }
    });
    cursorY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : cursorY + 80;
  } else {
    doc.setFontSize(11);
    doc.text('Top Proveedores', margin, cursorY);
    cursorY += 14;
  }

  // imagen bar
  if (barImg) {
    if (cursorY + 220 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); cursorY = margin; }
    cursorY += addImage(barImg);
  }

  // Movimientos mensuales
  if (doc.autoTable) {
    const line = this.stats.line || { labels: [], datasets: [] };
    const mRows = (line.labels || []).map((lab, idx) => {
      return [lab, (line.datasets[0] && line.datasets[0].data[idx]) || 0, (line.datasets[1] && line.datasets[1].data[idx]) || 0];
    });
    doc.autoTable({
      startY: cursorY,
      head: [['Mes','Entradas','Salidas']],
      body: mRows,
      theme: 'striped',
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin }
    });
    cursorY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : cursorY + 80;
  } else {
    doc.setFontSize(11);
    doc.text('Movimientos Mensuales (Entradas/Salidas)', margin, cursorY);
    cursorY += 14;
  }

  // imagen line
  if (lineImg) {
    if (cursorY + 220 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); cursorY = margin; }
    cursorY += addImage(lineImg);
  }

  // Footer
  if (cursorY + 40 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); cursorY = margin; }
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Reporte generado desde Stockly — datos extraídos del sistema.', margin, doc.internal.pageSize.getHeight() - margin);

  // Guardar
  try {
    doc.save(`reporte_estadisticas_${new Date().toISOString().slice(0,10)}.pdf`);
    console.log('[reportes] PDF guardado con jsPDF');
  } catch (e) {
    console.error('[reportes] error guardando PDF con jsPDF', e);
    // fallback a html2pdf si está disponible
    if (window.html2pdf) {
      console.log('[reportes] fallback a html2pdf porque jsPDF falló');
      return await this._downloadWithHtml2pdfFallback();
    } else {
      alert('Error generando PDF: ' + (e && e.message ? e.message : e));
    }
  }
},
// Helper fallback: usa html2pdf si jsPDF no funciona o falta
async _downloadWithHtml2pdfFallback() {
  try {
    // reusar el método original que crea container y utiliza html2pdf (tu versión anterior)
    console.log('[reportes] fallback html2pdf invoked');
    // llamada simple: exporta el div principal (puede fallar si canvases no se rasterizan)
    await window.html2pdf().from(this.$el).set({
      margin: [0.3,0.25,0.3,0.25],
      filename: `reporte_estadisticas_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).save();
    console.log('[reportes] html2pdf fallback finished');
  } catch (e) {
    console.error('[reportes] html2pdf fallback failed', e);
    alert('No se pudo generar el PDF con ninguno de los métodos disponibles. Revisa la consola para más info.');
  }
}
  }

  
});

// Helper: devuelve dataURL (JPEG o PNG) de un chart con fondo blanco
function chartToDataURLWithWhiteBg(chart, mime = 'image/jpeg', quality = 1.0) {
  if (!chart || !chart.canvas) return null;

  const srcCanvas = chart.canvas;
  // usar width/height del canvas real (ya incluye devicePixelRatio)
  const w = srcCanvas.width;
  const h = srcCanvas.height;

  // crear canvas temporal con mismas dimensiones
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  const ctx = tmp.getContext('2d');

  // pintar fondo blanco (evita transparencia -> no aparecerá negro luego)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // dibujar el canvas original encima
  ctx.drawImage(srcCanvas, 0, 0, w, h);

  // devolver dataURL; si pones 'image/jpeg' no habrá transparencia y fondo será blanco
  try {
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      return tmp.toDataURL('image/jpeg', quality);
    } else {
      return tmp.toDataURL('image/png');
    }
  } catch (e) {
    console.warn('chartToDataURLWithWhiteBg: fallo toDataURL, intentando png fallback', e);
    return tmp.toDataURL('image/png');
  }
}


app.mount('#vm-reportes');