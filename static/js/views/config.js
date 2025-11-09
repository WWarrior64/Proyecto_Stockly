// static/js/config.js
const app = Vue.createApp({
  delimiters: ['[[', ']]'],
  data() {
    return {
      showSettings: false,
      _docClickHandler: null,
      _keyDownHandler: null
    };
  },
  mounted() {
    // handlers enlazados que podemos remover luego
    this._docClickHandler = (e) => this._onDocumentClick(e);
    this._keyDownHandler = (e) => this._onKeydown(e);

    document.addEventListener('click', this._docClickHandler);
    document.addEventListener('keydown', this._keyDownHandler);
  },
  beforeUnmount() {
    if (this._docClickHandler) document.removeEventListener('click', this._docClickHandler);
    if (this._keyDownHandler) document.removeEventListener('keydown', this._keyDownHandler);
  },
  methods: {
    toggleSettings(ev) {
      this.showSettings = !this.showSettings;
      if (ev && ev.stopPropagation) ev.stopPropagation();
    },
    _onKeydown(e) {
      if (e.key === 'Escape' && this.showSettings) {
        this.showSettings = false;
      }
    },
    _onDocumentClick(e) {
      const root = document.getElementById('settings-root');
      if (!root) return;
      if (!root.contains(e.target) && this.showSettings) {
        this.showSettings = false;
      }
    }
  }
});

app.mount('#settings-root');