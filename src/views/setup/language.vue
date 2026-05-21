<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setupStore } from '../../core/store'
import { storeToRefs } from 'pinia'

defineOptions({
  name: 'SetupLanguage'
})

const { t } = useI18n()
const router = useRouter()
const { locale } = useI18n()
const setup = setupStore()
const { language } = storeToRefs(setup)

// 定义语言列表
const languages = [
  { label: t('setup.languagePage.followSystem'), subLabel: '', value: 'auto' },
  { label: t('setup.languagePage.english'), subLabel: 'English', value: 'en' },
  { label: t('setup.languagePage.simplifiedChinese'), subLabel: '简体中文', value: 'zh-Hans' },
  { label: t('setup.languagePage.traditionalChinese'), subLabel: '繁體中文', value: 'zh-Hant' },
  { label: t('setup.languagePage.japanese'), subLabel: '日本語', value: 'ja' },
  { label: t('setup.languagePage.korean'), subLabel: '한국어', value: 'ko' },
  { label: t('setup.languagePage.french'), subLabel: 'Français', value: 'fr' },
  { label: t('setup.languagePage.spanish'), subLabel: 'Español', value: 'es' },
  { label: t('setup.languagePage.portuguese'), subLabel: 'Português', value: 'pt' },
  { label: t('setup.languagePage.german'), subLabel: 'Deutsch', value: 'de' },
  { label: t('setup.languagePage.italian'), subLabel: 'Italiano', value: 'it' },
  { label: t('setup.languagePage.russian'), subLabel: 'Русский', value: 'ru' },
  { label: t('setup.languagePage.ukrainian'), subLabel: 'Українська', value: 'uk' },
  { label: t('setup.languagePage.thai'), subLabel: 'ภาษาไทย', value: 'th' },
  { label: t('setup.languagePage.vietnamese'), subLabel: 'Tiếng Việt', value: 'vi' },
  { label: t('setup.languagePage.khmer'), subLabel: 'ភាសាខ្មែរ', value: 'km' },
  { label: t('setup.languagePage.hindi'), subLabel: 'भाषा', value: 'hi' },
  { label: t('setup.languagePage.arabic'), subLabel: 'العربية', value: 'ar' },
  { label: t('setup.languagePage.hebrew'), subLabel: 'עברית', value: 'he' },
  { label: t('setup.languagePage.tibetan'), subLabel: 'བོད་ཡིག', value: 'bo' },
  { label: t('setup.languagePage.uyghur'), subLabel: 'ئۇيغۇر تىلى', value: 'ug' },
  { label: t('setup.languagePage.kazakh'), subLabel: 'қазақ тілі', value: 'kk' }
]

// 返回上一页
const goBack = () => {
  router.back();
}

// 选择语言
const selectLanguage = async (langValue: string) => {
  await setup.updateSetting('language', langValue);
  
  // 立即更新 i18n 的语言
  if (langValue === 'auto') {
    // 如果设置为 auto,检测浏览器语言
    const browserLang = navigator.language;
    if (browserLang === 'zh' || browserLang.startsWith('zh-CN') || browserLang.startsWith('zh-SG')) {
      locale.value = 'zh-Hans';
    } else if (browserLang.startsWith('zh-TW') || browserLang.startsWith('zh-HK') || browserLang.startsWith('zh-MO')) {
      locale.value = 'zh-Hant';
    } else if (browserLang.startsWith('ja')) {
      locale.value = 'ja';
    } else if (browserLang.startsWith('ko')) {
      locale.value = 'ko';
    } else if (browserLang.startsWith('fr')) {
      locale.value = 'fr';
    } else if (browserLang.startsWith('es')) {
      locale.value = 'es';
    } else if (browserLang.startsWith('pt')) {
      locale.value = 'pt';
    } else if (browserLang.startsWith('de')) {
      locale.value = 'de';
    } else if (browserLang.startsWith('it')) {
      locale.value = 'it';
    } else if (browserLang.startsWith('ru')) {
      locale.value = 'ru';
    } else if (browserLang.startsWith('uk')) {
      locale.value = 'uk';
    } else if (browserLang.startsWith('th')) {
      locale.value = 'th';
    } else if (browserLang.startsWith('vi')) {
      locale.value = 'vi';
    } else if (browserLang.startsWith('km')) {
      locale.value = 'km';
    } else if (browserLang.startsWith('hi')) {
      locale.value = 'hi';
    } else if (browserLang.startsWith('ar')) {
      locale.value = 'ar';
    } else if (browserLang.startsWith('he')) {
      locale.value = 'he';
    } else if (browserLang.startsWith('bo')) {
      locale.value = 'bo';
    } else if (browserLang.startsWith('ug')) {
      locale.value = 'ug';
    } else if (browserLang.startsWith('kk')) {
      locale.value = 'kk';
    } else {
      locale.value = 'en';
    }
  } else {
    // 直接使用选择的语言
    locale.value = langValue;
  }
  
  router.back();
}
</script>

<template>
  <div id="setupLanguageView">
    <div class="topBar">
      <div class="goback" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </div>
      <div class="label">
        {{ t('setup.languagePage.title') }}
      </div>
    </div>
    <!-- 内容区域 -->
    <div v-for="(lang, index) in languages" :key="index" class="item" @click="selectLanguage(lang.value)">
      <div class="label">
        <div>
          {{ lang.label }}
          <span class="tips">
            {{ lang.subLabel }}
          </span>
        </div>
      </div>
      <div class="icon">
        <font-awesome-icon icon="fa-solid fa-check" v-if="lang.value === language" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#setupLanguageView {
  overflow-y: auto;
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  background-color: #fafafa;

  &::-webkit-scrollbar-track {
    margin: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  }
}

.topBar {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;
  padding-top: env(safe-area-inset-top, 0);
  height: calc(env(safe-area-inset-top, 0) + 60px);
  background-color: rgba(0, 121, 107, 0.9);
  color: #fff;
  display: flex;
  align-items: center;
  user-select: none;

  .goback {
    padding: 0 16px;
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;

    svg {
      font-size: 1.5rem;
      color: white;
    }

    &:active {
      opacity: 0.7;
    }
  }

  .label {
    font-size: 1.2rem;
    font-weight: 500;
  }
}

.item {
  border-bottom: solid 1px #BDBDBD;
  color: #212121;
  font-size: 1rem;
  cursor: pointer;
  user-select: none;
  display: flex;
  width: 100%;
  overflow: hidden;
  padding: 0 14px;
  height: 52px;

  .label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-self: start;
    overflow: hidden;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-self: start;
    color: #9E9E9E;
  }

  .tips {
    display: block;
    font-size: 0.8rem;
    color: #9E9E9E;
  }
}
</style>