<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setStatusBarTextStyle } from '../plugins/navbarStyle'
import { setupStore } from '../core/store'
import { storeToRefs } from 'pinia'

defineOptions({
  name: 'Setup'
})

/**
 * 不会返回此页面，无需onActivated
 */
setStatusBarTextStyle('light')

const { t } = useI18n()
const router = useRouter()
const setup = setupStore()
const { autoPlay, definition, searchMode, aria2Switch, language } = storeToRefs(setup)

// 返回上一页
const goBack = () => {
  router.back();
}
// 路由跳转
function routerGoTo(path: string) {
  router.push(path);
}

// 切换自动播放
const toggleAutoPlay = async (value: boolean | null) => {
  await setup.updateSetting('autoPlay', Boolean(value));
};

// 获取语言显示文本
const getLanguageLabel = (lang: string) => {
  const langMap: Record<string, string> = {
    auto: t('setup.languagePage.followSystem'),
    'zh-Hans': t('setup.languagePage.simplifiedChinese'),
    en: t('setup.languagePage.english'),
    ja: t('setup.languagePage.japanese'),
    ko: t('setup.languagePage.korean'),
    fr: t('setup.languagePage.french'),
    es: t('setup.languagePage.spanish'),
    pt: t('setup.languagePage.portuguese'),
    de: t('setup.languagePage.german'),
    it: t('setup.languagePage.italian'),
    ru: t('setup.languagePage.russian'),
    uk: t('setup.languagePage.ukrainian'),
    th: t('setup.languagePage.thai'),
    vi: t('setup.languagePage.vietnamese'),
    km: t('setup.languagePage.khmer'),
    hi: t('setup.languagePage.hindi'),
    ar: t('setup.languagePage.arabic'),
    he: t('setup.languagePage.hebrew'),
    bo: t('setup.languagePage.tibetan'),
    ug: t('setup.languagePage.uyghur'),
    kk: t('setup.languagePage.kazakh'),
    'zh-Hant': t('setup.languagePage.traditionalChinese')
  }
  return langMap[lang] || 'English'
}
</script>

<template>
  <div id="setupView">
    <div class="topBar">
      <div class="goback" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </div>
      <div class="label">
        {{ t('setup.title') }}
      </div>
    </div>
    <!-- 内容区域 -->
    <div class="item" style="border-top: solid 1px #BDBDBD;">
      <div class="label">{{ t('setup.autoPlay') }}</div>
      <div class="value">
        <v-switch
          v-model="autoPlay"
          @update:model-value="toggleAutoPlay"
          density="compact"
          color="#00796B"
        ></v-switch>
      </div>
    </div>
    <div class="item" @click="routerGoTo('/setup/definition')">
      <div class="label">{{ t('setup.defaultDefinition') }}</div>
      <div class="value">
        <span>{{
          definition === '360' ? '360P' :
          definition === '540' ? '540P' :
          t('setup.original')
        }}</span>
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item" @click="routerGoTo('/setup/searchMode')">
      <div class="label">{{ t('setup.defaultSearchMode') }}</div>
      <div class="value">
        <span>{{ searchMode === 0 ? t('setup.keywordSearch') : t('setup.tagSearch') }}</span>
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item" @click="routerGoTo('/setup/download')">
      <div class="label">{{ t('setup.downloadSettings') }}</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item" @click="routerGoTo('/setup/aria2')">
      <div class="label">{{ t('setup.aria2Settings') }}</div>
      <div class="value">
        <span>{{ aria2Switch ? t('setup.enabled') : t('setup.disabled') }}</span>
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item" @click="routerGoTo('/setup/language')">
      <div class="label">{{ t('setup.language') }}</div>
      <div class="value">
        <span>{{ getLanguageLabel(language) }}</span>
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <!-- <div class="item">
      <div class="label">清理缓存</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div> -->
    <div class="item" @click="routerGoTo('/setup/about')">
      <div class="label">{{ t('setup.about') }}</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item">
      <div class="label">{{ t('setup.logout') }}</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#setupView {
  overflow-y: auto;
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  background-color: var(--color-bg-page);

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
  background-color: var(--color-primary-90);
  color: var(--color-text-on-primary);
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
  border-bottom: solid 1px var(--color-border-setting);
  color: var(--color-text-primary);
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

  .value {
    color: var(--color-text-hint);
    display: flex;
    align-items: center;
    justify-self: start;
  }

  .v-switch {
    transform: translateY(10px);
  }
}
</style>