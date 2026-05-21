/// <reference types="vite/client" />

// vue-i18n 类型声明扩展
import 'vue-i18n';

declare module 'vue-i18n' {
  // 定义消息资源的类型
  export interface DefineLocaleMessage {
    common: {};
  }
}

// 图片文件类型声明
declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}
