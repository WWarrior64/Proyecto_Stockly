// static/js/services/inventarioService.js
window.inventarioService = {
  async fetchModalHtml(url) {
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const text = await resp.text();
    return text;
  },

  // extrae solo el contenido entre <body>...</body> si existe
  extractBody(htmlString) {
    try {
      const lowered = htmlString.toLowerCase();
      if (lowered.includes('<body')) {
        // crear DOMParser para extraer body.innerHTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const body = doc.body;
        return body ? body.innerHTML : htmlString;
      }
    } catch (e) {
      console.warn('extractBody parse failed', e);
    }
    return htmlString;
  },

  // elimina etiquetas <script> para evitar ejecucion de scripts inyectados
  stripScripts(htmlString) {
    return htmlString.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  },

  // util completa: fetch -> extract body -> strip scripts -> return
  async fetchSanitizedModalHtml(url) {
    const raw = await this.fetchModalHtml(url);
    let body = this.extractBody(raw);
    body = this.stripScripts(body);
    return body;
  }
};
