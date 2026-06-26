<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { showShortToast } from '../core/toast';
import {
  login as api_login,
  getMyselfInfo
} from '../core/api';
import {
  login as db_login,
  getLastLoginAuth,
  updateUserInfo
} from '../core/database'; // 导入数据库登录函数
import { ai, isLogin, uid, uname } from '../core/store';

const aiStore = ai();
const { t } = useI18n();
const router = useRouter();

// 定义响应式数据
const username = ref('');
const password = ref('');
const usernameError = ref<string | null>(null);
const passwordError = ref<string | null>(null);
const loading = ref(false); // 新增：控制加载状态

// 验证规则
const usernameRule = computed(() => [(v: string) => !!v || t('login.usernameRequired')]);
const passwordRule = computed(() => [(v: string) => !!v || t('login.passwordRequired')]);

// 如果已经登录，直接跳转首页
if (isLogin().value) {
  router.push('/');
}

async function initLastLogin() {
  try {
    const lastAuth = await getLastLoginAuth();
    if (lastAuth) {
      username.value = lastAuth.email || '';
      password.value = lastAuth.password || '';
    }
  } catch (error) {
    console.error('Failed to get last login isLogin:', error);
  }
}

onMounted(() => {
  initLastLogin();
});

async function login() {
  // 如果正在加载中，则直接返回
  if (loading.value) return;

  // 清除之前的错误信息
  usernameError.value = null;
  passwordError.value = null;

  const usernameEmpty = !username.value.trim();
  const passwordEmpty = !password.value.trim();

  if (usernameEmpty && passwordEmpty) {
    // 两个都为空
    usernameError.value = t('login.usernameRequired');
    passwordError.value = t('login.passwordRequired');
    showShortToast(t('login.bothRequired'));
  } else if (usernameEmpty) {
    // 用户名为空
    usernameError.value = t('login.usernameRequired');
    showShortToast(t('login.usernameRequired'));
  } else if (passwordEmpty) {
    // 密码为空
    passwordError.value = t('login.passwordRequired');
    showShortToast(t('login.passwordRequired'));
  } else {
    // 都不为空，执行登录逻辑
    loading.value = true; // 开始加载
    try {
      // 调用API的login函数并获取状态码和响应数据
      const result = await api_login(username.value, password.value);
      // 检查HTTP状态码
      if (result.status === 200) {
        // 登录成功
        const token = result.data.token;
        if (result.data && result.data.token) {
          // 在数据库中记录登录用户
          await db_login(username.value, password.value, result.data.token);
          getMyselfInfo(aiStore.value).then(async (res) => {
            if (res.ok) {
              const userId = res.data.user.id;
              const userName = res.data.user.username;
              updateUserInfo(userId, userName);
              // 更新 store 中的 uid 和 uname
              uid().set(userId);
              uname().set(userName);
            } else {
              console.error('Failed to update user info:', res.message);
            }
          }).catch((err) => {
            console.error('Failed to update user info:', err);
          });
          const loginStore = isLogin();
          loginStore.set(true);
          loginStore.loginVersion++;
          showShortToast(t('login.success'));
          // 跳转到首页
          router.push('/');
        } else {
          showShortToast(t('login.invalidResponse'));
        }
      } else if (result.status === 400) {
        // 用户名或密码错误
        showShortToast(t('login.wrongCredentials'));
      } else if (result.status === 429) {
        // 登录过于频繁
        showShortToast(t('login.tooManyRequests'));
      } else {
        // 其他错误状态码
        showShortToast(t('login.failed', { status: result.status }));
      }
    } catch (error) {
      console.error('Login error:', error);
      showShortToast(t('login.networkError'));
    } finally {
      loading.value = false; // 结束加载
    }
  }
}
</script>
<template>
  <div id="loginView">
    <div class="language" @click="router.push('/setup/language')">
      <font-awesome-icon icon="fa-solid fa-language" />
      <span>{{ t('setup.language') }}</span>
    </div>
    <div class="form">
      <div class="title">{{ t('login.title') }}</div>
      <div class="input">
        <v-text-field v-model="username" :label="t('login.usernameLabel')" color="#00796B"
          :error-messages="usernameError ? [usernameError] : []"
          @blur="usernameError = !username.trim() ? t('login.usernameRequired') : null"></v-text-field>
      </div>
      <div class="input">
        <v-text-field v-model="password" :label="t('login.passwordLabel')" type="password" color="#00796B"
          :error-messages="passwordError ? [passwordError] : []"
          @blur="passwordError = !password.trim() ? t('login.passwordRequired') : null"></v-text-field>
      </div>
      <div class="submit">
        <v-btn class="btn" @click="login" color="#00796B" size="large" :loading="loading" :disabled="loading">{{ loading
          ? t('login.loggingIn') : t('login.loginBtn') }}</v-btn>
      </div>
    </div>
    <div class="about">
      <span class="logo">Hiwara</span>
      <br>
      {{ t('login.aboutText') }}
      <br>
      ©2023-2026 Hiwara Team
    </div>
  </div>
</template>
<style lang="scss" scoped>
#loginView {
  flex: 1;
  position: relative;
  background-color: var(--color-bg-page);
}

.form {
  width: 100%;
  padding: 20vh 12px 12px 12px;

  .title {
    font-size: 1.4rem;
    padding: 22px 0;
    color: var(--color-text-primary);
  }

  .input {
    padding-bottom: 6px;

    /* Vuetify 输入框暗黑模式适配 */
    :deep(.v-field) {
      background-color: var(--color-bg-card);
    }

    :deep(.v-label) {
      color: var(--color-text-placeholder) !important;
    }

    :deep(input) {
      color: var(--color-text-primary) !important;
    }
  }

  .submit {
    .btn {
      width: 100%;
    }
  }
}

.language {
  color: var(--color-text-muted-light);
  padding: 12px;
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  position: absolute;
  top: env(safe-area-inset-top, 0);
  right: 0;
}

.about {
  position: absolute;
  bottom: env(safe-area-inset-bottom, 0);
  width: 100%;
  color: var(--color-text-muted-light);
  font-size: 0.7rem;
  text-align: center;
  padding: 10px;

  @font-face {
    font-family: 'riwenlogo';
    /* 优先使用相对路径（Android assets目录） */
    src: url('/fonts/riwenlogo.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }

  .logo {
    font-family: 'riwenlogo';
    font-size: 0.8rem;
  }
}
</style>
