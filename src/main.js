import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./assets/css/base.css";

// 注意 tailwind要先於element引入

import * as ElementPlusIconsVue from "@element-plus/icons-vue";

const app = createApp(App);

// 註冊element ui icon 成組件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(ElementPlus);
app.use(router);

app.mount("#app");
