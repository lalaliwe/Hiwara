<script setup lang="ts"></script>
<template>
  <div class="video-player">
    <video src="https://ro.qisato.top:2096/public/VID_20220416_033049_395.mp4"></video>
    <div class="control"></div>
    <div class="control-fullscreen"></div>
  </div>
</template>
<style lang="scss" scoped>
.video-player {
  background-color: #000;
  overflow: hidden;
  position: relative;

  video {
    width: 100%;
    height: 100%;
  }

  .control {
    height: 100%;
    width: 100%;
    background-color: aqua;
    position: absolute;
    top: 0;
    left: 0;
  }

  .control-fullscreen {
    height: 100%;
    width: 100%;
    background-color: chartreuse;
    position: absolute;
    top: 0;
    left: 0;
  }
}
</style>