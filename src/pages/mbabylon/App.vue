<template>
  <div id="main">
    <div>
      <canvas id="renderCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { TestFbxLoader } from './TestFbxLoader';

onMounted(() => {
  let canvas = document.getElementById("renderCanvas") as unknown as HTMLCanvasElement;
  TestFbxLoader(canvas)
})
</script>
<style lang="scss" scoped>
#main {
  margin-top: 10px;
  width: 100%;
  justify-content: center;
  /* background-color: black; */
}
#renderCanvas {
  width: 1080px;
  height: 700px;
}
</style>
<style>
* {
  border: 0;
  margin: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>