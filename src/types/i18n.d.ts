// vue-i18n 类型增强：为 t() 提供翻译键路径的类型提示（基于 zh-Hans.json 的结构）
// 注意：必须使用 `export {}` 使本文件成为模块，从而触发 module augmentation，
// 避免遮蔽 vue-i18n 自身的类型声明（如 useI18n 等导出）。
export {}

declare module 'vue-i18n' {
  export interface DefineLocaleMessage {
    common: typeof import('../locale/zh-Hans.json')['common'];
    setup: typeof import('../locale/zh-Hans.json')['setup'];
    home: typeof import('../locale/zh-Hans.json')['home'];
    history: typeof import('../locale/zh-Hans.json')['history'];
    login: typeof import('../locale/zh-Hans.json')['login'];
    player: typeof import('../locale/zh-Hans.json')['player'];
    imageView: typeof import('../locale/zh-Hans.json')['imageView'];
    favorites: typeof import('../locale/zh-Hans.json')['favorites'];
    friends: typeof import('../locale/zh-Hans.json')['friends'];
    offlineCache: typeof import('../locale/zh-Hans.json')['offlineCache'];
    search: typeof import('../locale/zh-Hans.json')['search'];
    zone: typeof import('../locale/zh-Hans.json')['zone'];
    forum: typeof import('../locale/zh-Hans.json')['forum'];
    comment: typeof import('../locale/zh-Hans.json')['comment'];
    webview: typeof import('../locale/zh-Hans.json')['webview'];
    card: typeof import('../locale/zh-Hans.json')['card'];
  }
}
