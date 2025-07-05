<template>
  <div class="reward-history-page">
    <RewardHistorySearch />
  </div>
</template>

<script>

import RewardHistorySearch from '/src/components/RewardHistorySearch.vue'

export default {
  components: {
    RewardHistorySearch
  }
}
</script>

<style scoped>
.reward-history-page {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  height: 100%;
}
</style>