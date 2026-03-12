import App from './App.vue'
import router from './router'
import pinia from './store'
import i18n from './locales'
import uiProvider from './ui/provider'

// UnoCSS
import '@unocss/reset/tailwind-compat.css'
import 'virtual:uno.css'
// 全局样式
import '@renderer/assets/styles/globals.css'

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(uiProvider)
app.mount('#app')
