// static/js/views/home.js
import { homeService } from '/static/js/services/homeService.js';

const app = Vue.createApp({
  delimiters: ['[[', ']]'], // evita conflicto con Jinja2 si alguna vez usas templates
  data() {
    return {
      greeting_subtitle: '',
      description: ''
    };
  },
  created() {
    const data = homeService.getHomeContent();
    this.greeting_subtitle = data.greeting_subtitle;
    this.description = data.description;
  }
});

app.mount('#vm'); // recordar que el HTML usa id="vm" en el main
