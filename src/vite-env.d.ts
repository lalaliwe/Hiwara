/// <reference types="vite/client" />

// vue-i18n 类型声明扩展
import 'vue-i18n';

declare module 'vue-i18n' {
  // 定义消息资源的类型
  export interface DefineLocaleMessage {
    common: {
      loading: string;
      error: string;
      success: string;
      cancel: string;
      confirm: string;
      save: string;
      delete: string;
      edit: string;
      search: string;
      back: string;
      next: string;
      previous: string;
      close: string;
      open: string;
      yes: string;
      no: string;
      today: string;
      loadFailed: string;
      retry: string;
      reachedBottom: string;
    };
    navigation: {
      home: string;
      search: string;
      favorites: string;
      history: string;
      friends: string;
      zone: string;
      settings: string;
    };
    player: {
      play: string;
      pause: string;
      fullscreen: string;
      exitFullscreen: string;
      volume: string;
      mute: string;
      unmute: string;
      quality: string;
      speed: string;
      subtitle: string;
      download: string;
      video: string;
      image: string;
    };
    setup: {
      title: string;
      general: string;
      autoPlay: string;
      reconnect: string;
      definition: string;
      searchMode: string;
      language: string;
      paths: string;
      videoSavePath: string;
      imageSavePath: string;
      aria2: string;
      aria2Rpc: string;
      aria2Token: string;
      aria2Download: string;
      aria2Switch: string;
    };
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
