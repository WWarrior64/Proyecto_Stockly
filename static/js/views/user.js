// static/js/views/user.js
import { userService } from '/static/js/services/userService.js';

const app = Vue.createApp({
  delimiters: ['[[', ']]'],
  data() {
    return {
      user: {
        fullName: '',
        role: '',
        email: '',
        address: '',
        phone: '',
        avatar: '',
        extraFields: []
      }
    };
  },
  created() {
    // usar then() o async/await para asignar datos reales
    userService.getUser().then(data => {
      this.user = data;
    }).catch(err => {
      console.error('Error al cargar usuario:', err);
    });
  },
  methods: {
    logout() {
      userService.logout();
    }
  }
});

app.mount('#vm');
