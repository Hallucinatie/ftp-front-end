<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  max-width: 100vw;
  overflow: hidden;
  background-color: var(--bg-color);
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  max-width: 100vw;
}

* {
  box-sizing: border-box;
}

/* 确保主要内容区域占满剩余空间 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

</style>