<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getImageIwara } from '../../core/api';
import notImg from '../../static/img/not-img.jpg';
import iwaraSVG from '../../assets/svg/iwara.svg';

const router = useRouter();

interface HistoryItemProps {
  item: {
    id: string;
    title: string;
    img: string;
  };
}

const props = defineProps<HistoryItemProps>();

const displayImg = ref(props.item.img ? '' : notImg);

onMounted(async () => {
  if (props.item.img) {
    try {
      console.log('加载历史记录封面:', props.item.id);
      displayImg.value = await getImageIwara(props.item.img);
      console.log('历史记录封面加载成功:', props.item.id);
    } catch (error) {
      console.error('历史记录封面加载失败:', props.item.id, error);
      displayImg.value = notImg;
    }
  }
});

// 点击列表项跳转
function clickItem() {
  if (!props.item.id) {
    console.error('缺少id');
    return;
  }
  router.push({ path: `/player/${props.item.id}/${Math.random().toString(36).substring(2, 8)}` });
}
</script>

<template>
  <div class="videoListCard" @click="clickItem">
    <div class="preview">
      <v-img class="img" cover :src="displayImg">
        <template v-slot:placeholder>
          <div class="placeholder">
            <img :src="iwaraSVG" class="svg-icon" />
          </div>
        </template>
        <template v-slot:error>
          <img height="100%" :src="notImg" cover />
        </template>
      </v-img>
    </div>
    <div class="title">
      {{ item.title }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/mixins' as *;
.videoListCard {
  margin-right: 8px;
  cursor: pointer;
  user-select: none;

  .preview {
    .img {
      width: 100px;
      aspect-ratio: 16 / 10;
    }

    .placeholder {
      width: 100%;
      height: 100%;
      background-color: var(--color-bg-placeholder);
      display: flex;
      justify-content: center;
      align-items: center;

      .svg-icon {
        width: 40px;
      }
    }
  }

  .title {
    white-space: nowrap;
    font-size: 0.9rem;
    width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-text-primary);
  }

  @include up(md) {
    .preview .img {
      width: 140px;
    }
    .title {
      width: 140px;
    }
  }
}
</style>