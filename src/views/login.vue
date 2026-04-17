<script setup lang="ts">
import { ref, computed } from 'vue';
import { showShortToast } from '../core/toast';

// 定义响应式数据
const username = ref('');
const password = ref('');
const usernameError = ref<string | null>(null);
const passwordError = ref<string | null>(null);

// 验证规则
const usernameRule = computed(() => [(v: string) => !!v || '用户名不得为空']);
const passwordRule = computed(() => [(v: string) => !!v || '密码不得为空']);

function login() {
  // 清除之前的错误信息
  usernameError.value = null;
  passwordError.value = null;

  const usernameEmpty = !username.value.trim();
  const passwordEmpty = !password.value.trim();

  if (usernameEmpty && passwordEmpty) {
    // 两个都为空
    usernameError.value = '用户名不得为空';
    passwordError.value = '密码不得为空';
    showShortToast('用户名和密码不得为空');
  } else if (usernameEmpty) {
    // 用户名为空
    usernameError.value = '用户名不得为空';
    showShortToast('用户名不得为空');
  } else if (passwordEmpty) {
    // 密码为空
    passwordError.value = '密码不得为空';
    showShortToast('密码不得为空');
  } else {
    // 都不为空，执行登录逻辑
    showShortToast('登录成功');
  }
}
</script>
<template>
  <div id="loginView">
    <div class="language">
      <font-awesome-icon icon="fa-solid fa-language" />
      Language/语言
    </div>
    <div class="form">
      <div class="title">登录到你的Iwara账号</div>
      <div class="input">
        <v-text-field v-model="username" label="请输入用户名" color="#00796B"
          :error-messages="usernameError ? [usernameError] : []"
          @blur="usernameError = !username.trim() ? '用户名不得为空' : null"></v-text-field>
      </div>
      <div class="input">
        <v-text-field v-model="password" label="请输入密码" type="password" color="#00796B"
          :error-messages="passwordError ? [passwordError] : []"
          @blur="passwordError = !password.trim() ? '密码不得为空' : null"></v-text-field>
      </div>
      <div class="submit">
        <v-btn class="btn" @click="login" color="#00796B" size="large">登录</v-btn>
      </div>
    </div>
    <div class="about">
      <span class="logo">Hiwara</span>
      <br>
      本应用遵循MPL-2.0开源协议，请勿用于任何商业用途。
      <br>
      ©2023-2026 Hiwara Team
    </div>
  </div>
</template>
<style lang="scss" scoped>
#loginView {
  flex: 1;
  position: relative;
}

.form {
  width: 100%;
  padding: 20vh 12px 12px 12px;

  .title {
    font-size: 1.4rem;
    padding: 22px 0;
  }

  .input {
    padding-bottom: 6px;
  }

  .submit {
    .btn {
      width: 100%;
    }
  }
}

.language {
  color: #757575;
  padding: 12px;
  cursor: pointer;
  user-select: none;
  display: inline-block;
  font-size: 0.9rem;
  position: absolute;
  top: env(safe-area-inset-top, 0);
  right: 0;
}

.about {
  position: absolute;
  bottom: env(safe-area-inset-bottom, 0);
  width: 100%;
  color: #757575;
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