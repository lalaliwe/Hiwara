<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Video as iconVideo,
  Pic as iconPic,
  Rss as iconRss,
  Comments as iconComments,
  User as iconUser,
  SettingConfig as iconSetting
} from '@icon-park/vue-next';

const { t } = useI18n();
const router = useRouter()

// 定义Tab类型
type TabType = 'video' | 'image' | 'subscribe' | 'forum' | 'my';

// 定义emit事件
const emit = defineEmits<{
  (e: 'update:tab', value: TabType): void
  (e: 'refresh', tab: TabType): void
}>()

const props = defineProps<{
  modelValue?: TabType
}>()

const value = ref<TabType>(props.modelValue || "subscribe")
const btnFontSize = ref(24)

// 监听props.modelValue变化，确保与父组件保持同步
watch(() => props.modelValue, (newVal) => {
  if (newVal !== undefined && value.value !== newVal) {
    value.value = newVal
  }
})

// 监听value变化并emit事件
watch(value, (newValue) => {
  emit('update:tab', newValue)
})

// 更改value
const changeValue = (newValue: TabType) => {
  value.value = newValue
}

//刷新
function refresh(tab: TabType) {
  emit('refresh', tab)
}

// 跳转到设置页面
const goToSetup = () => {
  router.push('/setup')
}
</script>

<template>
  <div class="tabs-vertical">
    <div class="logo">
      <img src="/logo-square_2.0.svg" alt="" />
    </div>
    <div class="btn" :class="{ active: value === 'subscribe' }" @click="changeValue('subscribe')"
      @dblclick="refresh('subscribe')" v-ripple>
      <div>
        <iconRss theme="outline" :size="btnFontSize" />
        <br>
        <span>{{ t('home.navigation.subscribe') }}</span>
      </div>
    </div>
    <div class="btn" :class="{ active: value === 'video' }" @click="changeValue('video')" @dblclick="refresh('video')"
      v-ripple>
      <div>
        <iconVideo theme="outline" :size="btnFontSize" />
        <br>
        <span>{{ t('home.navigation.video') }}</span>
      </div>
    </div>
    <div class="btn" :class="{ active: value === 'image' }" @click="changeValue('image')" @dblclick="refresh('image')"
      v-ripple>
      <div>
        <iconPic theme="outline" :size="btnFontSize" />
        <br>
        <span>{{ t('home.navigation.image') }}</span>
      </div>
    </div>
    <div class="btn" :class="{ active: value === 'forum' }" @click="changeValue('forum')" @dblclick="refresh('forum')"
      v-ripple>
      <div>
        <iconComments theme="outline" :size="btnFontSize" />
        <br>
        <span>{{ t('home.navigation.forum') }}</span>
      </div>
    </div>
    <div class="btn" :class="{ active: value === 'my' }" @click="changeValue('my')" v-ripple>
      <div>
        <iconUser theme="outline" :size="btnFontSize" />
        <br>
        <span>{{ t('home.navigation.my') }}</span>
      </div>
    </div>
    <div class="spacer"></div>
    <div class="btn btn-setting" @click="goToSetup" v-ripple>
      <iconSetting theme="outline" :size="btnFontSize" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tabs-vertical {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-section);
  box-shadow: var(--shadow-vertical-nav);
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
  width: 100%;
  z-index: 500;

  .spacer {
    flex: 1;
  }
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-section);
  box-shadow: var(--shadow-vertical-nav);
  padding-bottom: env(safe-area-inset-bottom, 0);
  width: 100%;
  z-index: 500;

  .logo {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 13px auto;

    img {
      width: calc(100% + 24px);
      height: calc(100% + 24px);
    }
  }

  .btn {
    cursor: pointer;
    user-select: none;
    font-size: 0.8rem;
    transition: background-color 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 74px;
    text-align: center;
    color: var(--color-text-muted);

    svg {
      fill: var(--color-text-muted) !important;
    }

    &.active {
      background-color: var(--color-primary-20);
      color: var(--color-primary);

      svg {
        fill: var(--color-primary) !important;
      }
    }
  }
}
</style>
