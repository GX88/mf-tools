import { createApp } from 'vue'
import App from './App.vue'

import i18n from './locales'
import router from './router'
import { store } from './store'

import './assets/style/global.css'
import './assets/style/index.less'
import 'vue-sonner/style.css'

createApp(App).use(store).use(router).use(i18n).mount('#app').$nextTick(window.removeLoading)
