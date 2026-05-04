<script setup lang="ts">
import { useRouter } from 'vue-router'
import { setupStore } from '../../core/store'
import { storeToRefs } from 'pinia'

defineOptions({
  name: 'SetupLanguage'
})

const router = useRouter()
const setup = setupStore()
const { language } = storeToRefs(setup)

// 定义语言列表
const languages = [
  { label: '跟随系统', subLabel: '', value: 'auto' },
  { label: '英语', subLabel: 'English', value: 'en' },
  { label: '简体中文', subLabel: '简体中文', value: 'zh-Hans' },
  { label: '繁体中文', subLabel: '繁體中文', value: 'zh-Hant' },
  { label: '日语', subLabel: '日本語', value: 'ja' },
  { label: '韩语', subLabel: '한국어', value: 'ko' },
  { label: '法语', subLabel: 'Français', value: 'fr' },
  { label: '西班牙语', subLabel: 'Español', value: 'es' },
  { label: '葡萄牙语', subLabel: 'Português', value: 'pt' },
  { label: '德语', subLabel: 'Deutsch', value: 'de' },
  { label: '意大利语', subLabel: 'Italiano', value: 'it' },
  { label: '俄语', subLabel: 'Русский', value: 'ru' },
  { label: '乌克兰语', subLabel: 'Українська', value: 'uk' },
  { label: '泰语', subLabel: 'ภาษาไทย', value: 'th' },
  { label: '越南语', subLabel: 'Tiếng Việt', value: 'vi' },
  { label: '高棉语', subLabel: 'ភាសាខ្មែរ', value: 'km' },
  { label: '印地语', subLabel: 'भाषा', value: 'hi' },
  { label: '阿拉伯语', subLabel: 'العربية', value: 'ar' },
  { label: '希伯来语', subLabel: 'עברית', value: 'he ' },
  { label: '藏文', subLabel: 'བོད་ཡིག', value: 'bo' },
  { label: '维吾尔语', subLabel: 'ئۇيغۇر تىلى', value: 'ug' },
  { label: '哈萨克语', subLabel: 'қазақ тілі', value: 'kk' }
]

// 返回上一页
const goBack = () => {
  router.back();
}

// 选择语言
const selectLanguage = async (langValue: string) => {
  await setup.updateSetting('language', langValue);
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
        语言（Language）
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