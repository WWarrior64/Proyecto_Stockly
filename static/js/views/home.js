import { homeService } from "/static/js/services/homeService.js";

const app = Vue.createApp({
    data() {
        return {
            message: '',
            descripcion: ''
        };
    },
    mounted() {
        const data = homeService.getMensaje();
        this.message = data.message;
        this.descripcion = data.descripcion;
    }
});

app.config.compilerOptions.delimiters = ['[[', ']]'];


app.mount('#app');
