// static/js/services/reportesService.js
export const reportesService = {
  async getStats() {
    const resp = await fetch('/reportes/api/stats');
    if (!resp.ok) {
      throw new Error(`Error HTTP: ${resp.status}`);
    }
    return await resp.json();
  }
};