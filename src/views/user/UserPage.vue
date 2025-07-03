<!-- src/views/user/UserPage.vue -->
<template>
  <div class="user-page">
    <UserSearch />
  </div>
</template>

<script>
import UserSearch from '/src/components/UserSearch.vue'

export default {

  components: {
    UserSearch
  }
}
</script>

<style scoped>
.user-page {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>