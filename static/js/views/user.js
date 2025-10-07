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
      },
      loading: true
    };
  },
  async created() {
    this.loading = true;
    const data = await userService.getUser();
    this.user = data;
    this.loading = false;
  },
  methods: {
    async logout() {
      await userService.logout();
      // userService.logout() redirige al login
    }
  }
});

app.mount('#vm');
