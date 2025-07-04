<template>
  <div class="reward-history-page">
    <RewardHistorySearch :token="token" />
  </div>
</template>

<script>
import { inject } from 'vue'
import RewardHistorySearch from '/src/components/RewardHistorySearch.vue'

export default {
  components: {
    RewardHistorySearch
  },
  setup() {
    const token = inject('adminToken') || localStorage.getItem('adminToken')
    return {
      token
    }
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