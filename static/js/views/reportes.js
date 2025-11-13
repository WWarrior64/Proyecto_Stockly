import { reportesService } from "/static/js/services/reportesService.js";

const { createApp } = Vue;

const app = createApp({
  delimiters: ["[[", "]]"],
  data() {
    return {
      stats: null,
      loading: true,
      error: null,
      showSettings: false,
    };
  },
  async created() {
    try {
      this.stats = await reportesService.getStats();
    } catch (e) {
      console.error("Error cargando stats", e);
      this.error = e.message || "Error cargando datos";
    } finally {
      this.loading = false;
      this.$nextTick(() => {
        this.initCharts();
      });
    }
  },
  methods: {
    toggleSettings() {
      this.showSettings = !this.showSettings;
    },
    initCharts() {
      if (!this.stats) return;

      const colors = {
        primary: [
          "#14b8a6",
          "#f97316",
          "#3b82f6",
          "#ef4444",
          "#8b5cf6",
          "#10b981",
          "#f59e0b",
        ],
        teal: "#14b8a6",
        orange: "#f97316",
        blue: "#3b82f6",
      };

      const donutCtx = document.getElementById("donutChart");
      if (donutCtx) {
        this.donutChart = new Chart(donutCtx, {
          type: "doughnut",
          data: {
            labels: this.stats.donut.labels,
            datasets: [
              {
                data: this.stats.donut.data,
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: "#fff",
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "right",
                labels: {
                  padding: 15,
                  font: { size: 12 },
                },
              },
            },
          },
        });
      }

      const barCtx = document.getElementById("barChart");
      if (barCtx) {
        this.barChart = new Chart(barCtx, {
          type: "bar",
          data: {
            labels: this.stats.bar.labels,
            datasets: this.stats.bar.datasets.map((ds, idx) => ({
              label: ds.label,
              data: ds.data,
              backgroundColor: idx === 0 ? colors.teal : colors.orange,
              borderRadius: 4,
            })),
          },
          options: {
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: { precision: 0 },
              },
            },
            plugins: {
              legend: {
                labels: { font: { size: 12 } },
              },
            },
          },
        });
      }

      const lineCtx = document.getElementById("lineChart");
      if (lineCtx) {
        this.lineChart = new Chart(lineCtx, {
          type: "line",
          data: {
            labels: this.stats.line.labels,
            datasets: this.stats.line.datasets.map((ds, idx) => ({
              label: ds.label,
              data: ds.data,
              borderColor: idx === 0 ? colors.teal : colors.orange,
              backgroundColor:
                idx === 0 ? colors.teal + "20" : colors.orange + "20",
              borderWidth: 3,
              fill: true,
              tension: 0.4,
            })),
          },
          options: {
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: { precision: 0 },
              },
            },
            plugins: {
              legend: {
                labels: { font: { size: 12 } },
              },
            },
          },
        });
      }
    },

    async downloadReport() {
      console.log("Iniciando generación de PDF");

      if (!this.stats) {
        alert("No hay datos para generar el informe.");
        return;
      }

      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) {
        alert(
          "jsPDF no está disponible. Verifica que la librería esté cargada."
        );
        return;
      }

      await new Promise((r) => setTimeout(r, 100));

      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      doc.setFontSize(24);
      doc.setTextColor(20, 184, 166);
      doc.setFont(undefined, "bold");
      doc.text("Stockly", margin, y);

      y += 10;
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("Reporte de Estadísticas", margin, y);

      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.setFont(undefined, "normal");
      doc.text(
        `Generado: ${new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        margin,
        y
      );

      y += 15;
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      const ind = this.stats.indicators || {};

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, "bold");
      doc.text("INDICADORES PRINCIPALES", margin, y);
      y += 8;

      const indicators = [
        {
          label: "Disponibilidad",
          value: `${ind.availability || 0}%`,
          color: [20, 184, 166],
        },
        {
          label: "Valor Total Inventario",
          value: `$${Number(ind.total_value || 0).toLocaleString("es-CL")}`,
          color: [249, 115, 22],
        },
        {
          label: "Antigüedad Promedio Pedidos",
          value: `${ind.avg_age || "Sin datos"}`,
          color: [139, 92, 246],
        },
      ];

      const boxWidth = (contentWidth - 10) / 3;
      const boxHeight = 25;

      indicators.forEach((item, idx) => {
        const x = margin + idx * (boxWidth + 5);

        doc.setFillColor(item.color[0], item.color[1], item.color[2], 0.1);
        doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, "F");

        doc.setFontSize(20);
        doc.setTextColor(item.color[0], item.color[1], item.color[2]);
        doc.setFont(undefined, "bold");
        doc.text(item.value, x + 3, y + 12);

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, "normal");
        doc.text(item.label, x + 3, y + 19);
      });

      y += boxHeight + 12;

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, "bold");
      doc.text("DISTRIBUCIÓN POR CATEGORÍA", margin, y);
      y += 5;

      if (doc.autoTable) {
        const donut = this.stats.donut || { labels: [], data: [] };
        const totalCat =
          donut.data.reduce((s, x) => s + (Number(x) || 0), 0) || 0;
        const catRows = donut.labels.map((lab, idx) => {
          const v = Number(donut.data[idx] || 0);
          const pct = totalCat ? ((v / totalCat) * 100).toFixed(1) + "%" : "0%";
          return [lab, v, pct];
        });

        doc.autoTable({
          startY: y,
          head: [["Categoría", "Productos", "Porcentaje"]],
          body: catRows,
          theme: "striped",
          headStyles: {
            fillColor: [20, 184, 166],
            fontSize: 10,
            fontStyle: "bold",
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          margin: { left: margin, right: margin },
          columnStyles: {
            1: { halign: "center" },
            2: { halign: "center" },
          },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      if (this.donutChart && this.donutChart.canvas) {
        const imgData = this.chartToDataURL(this.donutChart);
        if (imgData) {
          const imgWidth = contentWidth * 0.8;
          const imgHeight = imgWidth * 0.7;

          if (y + imgHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }

          doc.addImage(
            imgData,
            "PNG",
            margin + (contentWidth - imgWidth) / 2,
            y,
            imgWidth,
            imgHeight
          );
          y += imgHeight + 12;
        }
      }

      if (y > pageHeight - 50) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, "bold");
      doc.text("TOP PROVEEDORES", margin, y);
      y += 5;

      if (doc.autoTable) {
        const bar = this.stats.bar || { labels: [], datasets: [] };
        const barRows = bar.labels.map((label, i) => {
          const pedidos = (bar.datasets[0] && bar.datasets[0].data[i]) || 0;
          const cantidad = (bar.datasets[1] && bar.datasets[1].data[i]) || 0;
          return [label, pedidos, cantidad];
        });

        doc.autoTable({
          startY: y,
          head: [["Proveedor", "N° Pedidos", "Cantidad Total"]],
          body: barRows,
          theme: "striped",
          headStyles: {
            fillColor: [249, 115, 22],
            fontSize: 10,
            fontStyle: "bold",
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          margin: { left: margin, right: margin },
          columnStyles: {
            1: { halign: "center" },
            2: { halign: "center" },
          },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      if (this.barChart && this.barChart.canvas) {
        const imgData = this.chartToDataURL(this.barChart);
        if (imgData) {
          const imgWidth = contentWidth * 0.85;
          const imgHeight = imgWidth * 0.5;

          if (y + imgHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }

          doc.addImage(
            imgData,
            "PNG",
            margin + (contentWidth - imgWidth) / 2,
            y,
            imgWidth,
            imgHeight
          );
          y += imgHeight + 12;
        }
      }

      if (y > pageHeight - 50) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, "bold");
      doc.text("TENDENCIA DE MOVIMIENTOS", margin, y);
      y += 5;

      if (doc.autoTable) {
        const line = this.stats.line || { labels: [], datasets: [] };
        const lineRows = line.labels.map((lab, idx) => {
          const entradas =
            (line.datasets[0] && line.datasets[0].data[idx]) || 0;
          const salidas = (line.datasets[1] && line.datasets[1].data[idx]) || 0;
          return [lab, entradas, salidas];
        });

        doc.autoTable({
          startY: y,
          head: [["Mes", "Entradas", "Salidas"]],
          body: lineRows,
          theme: "striped",
          headStyles: {
            fillColor: [59, 130, 246],
            fontSize: 10,
            fontStyle: "bold",
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          margin: { left: margin, right: margin },
          columnStyles: {
            1: { halign: "center" },
            2: { halign: "center" },
          },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      if (this.lineChart && this.lineChart.canvas) {
        const imgData = this.chartToDataURL(this.lineChart);
        if (imgData) {
          const imgWidth = contentWidth * 0.95;
          const imgHeight = imgWidth * 0.4;

          if (y + imgHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }

          doc.addImage(
            imgData,
            "PNG",
            margin + (contentWidth - imgWidth) / 2,
            y,
            imgWidth,
            imgHeight
          );
        }
      }

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "Reporte generado desde Stockly - Sistema de Gestión de Inventario",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      try {
        doc.save(
          `Reporte_Stockly_${new Date().toISOString().slice(0, 10)}.pdf`
        );
        console.log("PDF generado exitosamente");
      } catch (e) {
        console.error("Error al guardar PDF:", e);
        alert("Error al generar PDF: " + e.message);
      }
    },

    chartToDataURL(chart) {
      if (!chart || !chart.canvas) return null;

      const srcCanvas = chart.canvas;
      const w = srcCanvas.width;
      const h = srcCanvas.height;

      // Crear canvas con mayor resolución para mejor calidad en PDF
      const scaleFactor = 2;
      const tmp = document.createElement("canvas");
      tmp.width = w * scaleFactor;
      tmp.height = h * scaleFactor;
      const ctx = tmp.getContext("2d");

      // Escalar el contexto para mantener la calidad
      ctx.scale(scaleFactor, scaleFactor);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(srcCanvas, 0, 0, w, h);

      try {
        return tmp.toDataURL("image/png", 1.0);
      } catch (e) {
        console.warn("Error al convertir chart a imagen:", e);
        return null;
      }
    },
  },
});

app.mount("#vm-reportes");
