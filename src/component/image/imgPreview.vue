<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { getImageIwara } from '../../core/api';
import placeholderImg from '../../static/img/placeholder.png'
import notImg from '../../static/img/not-img.jpg'

interface ImageFile {
  id: string;
  name: string;
}
interface ImgPreviewProps {
  pid: string;
  images: ImageFile[]; // 插画图片URL数组
}

const props = defineProps<ImgPreviewProps>();
const emit = defineEmits(['resolution', 'fullScreen']);

// 图片展开状态
const imageExpand = ref(false);
// 处理后的图片URL数组
const processedImages = ref<string[]>([]);
// 加载状态
const loading = ref(false);
// 第一张图片ref
const firstImg = ref<HTMLImageElement>();

// 判断是否为服务器URL（需要特殊处理）
const isServerUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

// 处理单个图片文件对象
const processImageFile = async (file: ImageFile): Promise<string> => {
  try {
    const url = `https://i.iwara.tv/image/large/${file.id}/${file.name}`;
    return await getImageIwara(url);
  } catch (error) {
    console.error('Failed to load image:', file, error);
    return notImg;
  }
};

// 处理所有图片
const loadImages = async () => {
  if (!props.images || props.images.length === 0) {
    processedImages.value = [];
    return;
  }

  loading.value = true;
  try {
    const results = await Promise.all(props.images.map(processImageFile));
    processedImages.value = results;
  } catch (error) {
    console.error('Failed to load images:', error);
    processedImages.value = [];
  } finally {
    loading.value = false;
  }
};

// 监听images变化，重新加载
watch(() => props.images, () => {
  loadImages();
}, { immediate: true });

// 组件卸载时清理Blob URL
onMounted(() => {
  // 初始加载已在watch中处理
});

const onImageLoaded = () => {
  const realImgElement = firstImg.value;
  if (realImgElement) {
    const width = realImgElement.naturalWidth;
    const height = realImgElement.naturalHeight;
    console.log(`Image loaded: ${width}x${height}`);
    emit('resolution', { width, height });
  }
};

// 全屏大图
function fullScreen() {
  if (processedImages.value.length <= 1)
    emit('fullScreen');
  else {
    if (imageExpand.value)
      emit('fullScreen');
    else
      imageExpand.value = true;
  }
}
</script>

<template>
  <div class="imgPreview">
    <!-- 主图 -->
    <v-img v-if="processedImages.length > 0" cover :src="processedImages[0]" @load="onImageLoaded" ref="firstImg"
      @click="fullScreen">
      <template v-slot:placeholder>
        <v-img cover :src="placeholderImg"></v-img>
      </template>
    </v-img>
    <!-- 占位图（如果没有主图） -->
    <v-img v-else cover :src="placeholderImg"></v-img>

    <!-- 额外的图片（展开时显示） -->
    <div v-if="imageExpand && processedImages.length > 1">
      <v-img v-for="(img, index) in processedImages.slice(1)" :key="index" cover :src="img"></v-img>
    </div>
    <!-- 展开/收起按钮（只有多张图片时才显示） -->
    <span v-if="processedImages.length > 1" class="expand-btn" @click="imageExpand = !imageExpand">
      {{ imageExpand ? '收起' : '展开全部' }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.imgPreview {
  width: 100%;
  position: relative;

  .expand-btn {
    color: #fff;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
    display: inline-block;
    position: absolute;
    right: 0;
    bottom: 0;
    padding: 6px 10px;
    font-size: 0.9rem;
    user-select: none;
    cursor: pointer;
  }
}
</style>