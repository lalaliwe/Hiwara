<script setup lang="ts">
import { moveTaskToBack } from '../../plugins/appControl'
const handleMinimize = async () => {
  const result = await moveTaskToBack()
  if (result.success) {
    console.log('应用已最小化到后台')
  }
}
</script>
<template>
  <div>
    <v-btn @click="handleMinimize">
      关闭程序
    </v-btn>
  </div>
</template>
<style lang="scss" scoped></style>