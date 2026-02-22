<script setup lang="ts">
import homeSearchBar from '../component/homeSearchBar.vue';
import homeBottomButton from '../component/homeBottomButton.vue';
import cardButton from '../component/cardButton.vue';
import notImg from '../static/img/not-img.jpg';
import test1Img from '../static/img/test1.jpg';
</script>

<template>
  <div>
    <homeSearchBar class="homeSearchBar" />
    <div class="content">
      <cardButton v-for="value in 20" />
    </div>
    <homeBottomButton class="homeBottomButton" />
  </div>
</template>

<style lang="scss" scoped>
.homeSearchBar {
  z-index: 200;
}

.content {
  z-index: 1;
  padding: calc(65px + env(safe-area-inset-top, 0)) 5px 80px 5px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.homeBottomButton {
  z-index: 200;
}
</style>