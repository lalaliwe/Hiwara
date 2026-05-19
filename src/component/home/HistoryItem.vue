<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getImageIwara } from '../../core/api';
import notImg from '../../static/img/not-img.jpg';
import iwaraSVG from '../../assets/svg/iwara.svg';

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
</script>

<template>
  <div class="videoListCard">
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
.videoListCard {
  margin-right: 8px;

  .preview {
    .img {
      width: 100px;
      aspect-ratio: 16 / 10;
    }

    .placeholder {
      width: 100%;
      height: 100%;
      background-color: #d0d0d0;
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
  }
}
</style>