import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/style.scss";

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
const vuetify = createVuetify({
  components,
  directives,
})

import { install } from '@icon-park/vue-next/es/all'
import '@icon-park/vue-next/styles/index.css';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

import Hammer from 'hammerjs';

const app = createApp(App);

app.use(router);
app.use(vuetify);
install(app);
install(app, 'i');
library.add(fas, far, fab)
app.component('font-awesome-icon', FontAwesomeIcon);
app.config.globalProperties.$hammer = Hammer;
app.mount("#app");
