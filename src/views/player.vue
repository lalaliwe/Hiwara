<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onMounted, onUnmounted } from 'vue';

// 设置组件名称，确保与路由name一致
defineOptions({
  name: 'Player'
})

const router = useRouter();

onMounted(() => {
  console.log('✅ Player mounted');
})
onUnmounted(() => {
  console.log('❌ Player unmounted');
})

function goBack() {
  router.push('/');
}
</script>
<template>
  <div class="player-container">
    <div class="header">
      <v-btn icon @click="goBack" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <h1>播放器</h1>
    </div>
    <div class="content">
      <!-- 播放器内容 -->
      <div class="player-card">
        <div class="video-placeholder">
          <v-icon size="64">mdi-play-circle-outline</v-icon>
          <p>视频播放区域</p>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.player-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: white;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;

  h1 {
    margin: 0 0 0 16px;
    flex: 1;
    font-size: 1.25rem;
    font-weight: 500;
  }
}

.content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f5f5f5;
}

.player-card {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
}

.video-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .v-icon {
    margin-bottom: 16px;
  }

  p {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
  }
}
</style>