<template>
  <div class="admin-container">

    <div class="admin-tabs">
      <el-button 
        :type="activeTab === 'user' ? 'primary' : ''" 
        @click="activeTab = 'user'"
      >
        用户查询
      </el-button>
      <!-- <el-button 
        :type="activeTab === 'entry' ? 'primary' : ''" 
        @click="activeTab = 'entry'"
      >
        词条查询
      </el-button> -->
    </div>
    
    <div class="tab-content">
      <UserSearch v-if="activeTab === 'user'" :token="token"/>
      <!-- <EntrySearch v-else /> -->
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import UserSearch from './UserSearch.vue'


export default {
  components: {
    UserSearch
    //,EntrySearch
  },
  props: ['token'],
  setup() {
    const activeTab = ref('user') // 默认显示用户查询
    
    return {
      activeTab
    }
  }
}
</script>

<style scoped>
.admin-container {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.admin-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.tab-content {
  min-height: 400px;
}
</style>