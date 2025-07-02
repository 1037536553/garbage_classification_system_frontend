<template>
  <div id="app">
    <h1>垃圾分类系统 - 管理员模块</h1>
    <AdminPage />
  </div>
</template>

<script>
import AdminPage from '/src/components/AdminPage.vue'

export default {
  name: 'App',
  components: {
    AdminPage
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>

