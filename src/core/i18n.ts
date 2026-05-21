import { createI18n } from 'vue-i18n';
import { setupStore } from './store';

// 导入语言文件（使用 BCP 47 语言标签）
import zhHans from '../locales/zh-Hans.json';
import zhHant from '../locales/zh-Hant.json';
import en from '../locales/en.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';
import de from '../locales/de.json';
import it from '../locales/it.json';
import ru from '../locales/ru.json';
import uk from '../locales/uk.json';
import th from '../locales/th.json';
import vi from '../locales/vi.json';
import km from '../locales/km.json';
import hi from '../locales/hi.json';
import ar from '../locales/ar.json';
import he from '../locales/he.json';
import bo from '../locales/bo.json';
import ug from '../locales/ug.json';
import kk from '../locales/kk.json';

// 定义支持的语言类型（BCP 47 标准）
type SupportedLocale = 'auto' | 'en' | 'zh-Hans' | 'zh-Hant' | 'ja' | 'ko' | 'fr' | 'es' | 'pt' | 'de' | 'it' | 'ru' | 'uk' | 'th' | 'vi' | 'km' | 'hi' | 'ar' | 'he' | 'bo' | 'ug' | 'kk';
type ResolvedLocale = 'en' | 'zh-Hans' | 'zh-Hant' | 'ja' | 'ko' | 'fr' | 'es' | 'pt' | 'de' | 'it' | 'ru' | 'uk' | 'th' | 'vi' | 'km' | 'hi' | 'ar' | 'he' | 'bo' | 'ug' | 'kk';

// 语言消息对象
const messages = {
  'en': en,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  'ja': ja,
  'ko': ko,
  'fr': fr,
  'es': es,
  'pt': pt,
  'de': de,
  'it': it,
  'ru': ru,
  'uk': uk,
  'th': th,
  'vi': vi,
  'km': km,
  'hi': hi,
  'ar': ar,
  'he': he,
  'bo': bo,
  'ug': ug,
  'kk': kk,
};

// 检测浏览器语言并转换为 BCP 47 标签
function detectBrowserLanguage(): ResolvedLocale {
  const browserLang = navigator.language;
  
  // 匹配简体中文 (zh-CN, zh-SG, zh)
  if (browserLang === 'zh' || browserLang.startsWith('zh-CN') || browserLang.startsWith('zh-SG')) {
    return 'zh-Hans';
  }
  // 匹配繁体中文 (zh-TW, zh-HK, zh-MO)
  if (browserLang.startsWith('zh-TW') || browserLang.startsWith('zh-HK') || browserLang.startsWith('zh-MO')) {
    return 'zh-Hant';
  }
  // 匹配日语
  if (browserLang.startsWith('ja')) {
    return 'ja';
  }
  // 匹配韩语
  if (browserLang.startsWith('ko')) {
    return 'ko';
  }
  // 匹配法语
  if (browserLang.startsWith('fr')) {
    return 'fr';
  }
  // 匹配西班牙语
  if (browserLang.startsWith('es')) {
    return 'es';
  }
  // 匹配葡萄牙语
  if (browserLang.startsWith('pt')) {
    return 'pt';
  }
  // 匹配德语
  if (browserLang.startsWith('de')) {
    return 'de';
  }
  // 匹配意大利语
  if (browserLang.startsWith('it')) {
    return 'it';
  }
  // 匹配俄语
  if (browserLang.startsWith('ru')) {
    return 'ru';
  }
  // 匹配乌克兰语
  if (browserLang.startsWith('uk')) {
    return 'uk';
  }
  // 匹配泰语
  if (browserLang.startsWith('th')) {
    return 'th';
  }
  // 匹配越南语
  if (browserLang.startsWith('vi')) {
    return 'vi';
  }
  // 匹配高棉语
  if (browserLang.startsWith('km')) {
    return 'km';
  }
  // 匹配印地语
  if (browserLang.startsWith('hi')) {
    return 'hi';
  }
  // 匹配阿拉伯语
  if (browserLang.startsWith('ar')) {
    return 'ar';
  }
  // 匹配希伯来语
  if (browserLang.startsWith('he')) {
    return 'he';
  }
  // 匹配藏文
  if (browserLang.startsWith('bo')) {
    return 'bo';
  }
  // 匹配维吾尔语
  if (browserLang.startsWith('ug')) {
    return 'ug';
  }
  // 匹配哈萨克语
  if (browserLang.startsWith('kk')) {
    return 'kk';
  }
  // 默认返回英语
  return 'en';
}

// 获取当前语言
function getCurrentLocale(): ResolvedLocale {
  const storeLanguage = setupStore().language;
  
  // 如果设置为 auto,则检测浏览器语言
  if (storeLanguage === 'auto') {
    return detectBrowserLanguage();
  }
  
  // 否则使用设置的语言,如果不在支持列表中则返回默认值
  return (messages[storeLanguage as keyof typeof messages] ? storeLanguage : 'zh-Hans') as ResolvedLocale;
}

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getCurrentLocale(), // 初始语言
  fallbackLocale: 'zh-Hans', // 回退语言
  messages, // 语言包
});

// 导出语言切换函数
export function setLanguage(locale: SupportedLocale) {
  // 如果设置为 auto,则检测浏览器语言
  let resolvedLocale: ResolvedLocale;
  if (locale === 'auto') {
    resolvedLocale = detectBrowserLanguage();
  } else {
    resolvedLocale = (messages[locale as keyof typeof messages] ? locale : 'zh-Hans') as ResolvedLocale;
  }
  
  // 更新 i18n 实例的语言
  i18n.global.locale.value = resolvedLocale;
}

// 导出初始化函数(用于在应用启动时根据 store 设置语言)
export function initI18nLanguage() {
  const currentLocale = getCurrentLocale();
  i18n.global.locale.value = currentLocale;
}

export default i18n;
