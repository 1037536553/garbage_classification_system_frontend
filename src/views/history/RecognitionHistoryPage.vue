<template>
  <div class="history-page">
    
      <RecognitionHistorySearch/>
      <RecognitionHistoryStatus/>

  </div>
</template>

<script>
import { inject } from 'vue'
import RecognitionHistorySearch from '/src/components/RecognitionHistorySearch.vue'
import RecognitionHistoryStatus from '/src/components/RecognitionHistoryStatus.vue';

export default {
  components: {
    RecognitionHistorySearch,
    RecognitionHistoryStatus
  }
}
</script>

<style scoped>
.history-page {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.page-title {
  color: #409eff;
  margin-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

</style>