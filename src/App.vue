<template>
  <div id="app">
    <EnhancedFtpClient />
  </div>
</template>

<script>
import EnhancedFtpClient from './components/FileUpload.vue'

export default {
  name: 'App',
  components: {
    EnhancedFtpClient
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
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