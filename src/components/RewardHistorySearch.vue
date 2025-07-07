<template>
  <div class="reward-history">
    <div class="header">
      <div class="search-box">
        <el-input 
          v-model="searchUserId" 
          placeholder="请输入用户ID" 
          clearable 
          @keyup.enter="searchHistory"
          class="search-input"
          style="flex: 1"
        >
          <template #prepend>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
        <el-button 
          type="success" 
          @click="searchHistory" 
          :disabled="loading || !searchUserId"
          class="search-button"
          style="margin-left: 10px;"
        >
          <el-icon><Search /></el-icon> 搜索
        </el-button>
        <el-button 
          type="info" 
          @click="resetSearch"
          class="reset-button"
        >
          <el-icon><Refresh /></el-icon> 重置
        </el-button>
      </div>
    </div>

    <div class="filters">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        class="date-picker"
      />
      
      <el-input
        v-model="filterRewardName"
        placeholder="搜索兑换物品"
        clearable
        class="reward-filter"
      >
        <template #prefix>
          <el-icon><Goods /></el-icon>
        </template>
      </el-input>
    </div>

    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" style="font-size: 24px;">
        <Loading />
      </el-icon>
      <span>搜索中...</span>
    </div>

    <div v-if="searchError" class="error-message">
      {{ searchError }}
    </div>

    <div v-if="historyList.length > 0" class="result-container">
      <div class="summary">
        <div class="summary-item">
          <el-icon><Document /></el-icon>
          <span>兑换记录: {{ historyList.length }} 条</span>
        </div>
        <div class="summary-item">
          <el-icon><Coin /></el-icon>
          <span>总消耗积分: {{ totalPointsSpent }} 分</span>
        </div>
        <div class="summary-item">
          <el-icon><Goods /></el-icon>
          <span>兑换物品: {{ uniqueRewards }} 种</span>
        </div>
      </div>
      
      <el-table 
        :data="filteredHistory" 
        border 
        style="width: 100%; margin-top: 15px"
        height="calc(100vh - 320px)"
        :default-sort="{ prop: 'created_at', order: 'descending' }"
      >
        <el-table-column prop="id" label="记录ID" width="100" sortable />
        <el-table-column prop="user_id" label="用户ID" width="80" />
        <el-table-column prop="reward_name" label="兑换物品"  sortable/>
        <el-table-column prop="reward_id" label="奖品ID"  width="100" sortable/>
        <el-table-column prop="points_spent" label="消耗积分" sortable>
          <template #default="{ row }">
            <el-tag type="danger">{{ row.points_spent }} 分</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="兑换时间"  sortable />
        <el-table-column prop="address" label="地址"  sortable />
        <el-table-column prop="phone_number" label="电话"  sortable />
      </el-table>
    </div>

    <div v-if="!loading && historyList.length === 0 && !searchError" class="no-data">
      <el-empty description="暂无兑换历史记录" />
    </div>


  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { 
  ElMessage
} from 'element-plus'
import {
    Search,
    Refresh,
    Loading,
    User,
    Document,
    Goods,
    Coin
} from '@element-plus/icons-vue'
import axios from 'axios'
import { baseURL } from '/src/config.js'

export default {
  components: {
    Search,
    Refresh,
    Loading,
    User,
    Document,
    Goods,
    Coin
  },
  setup() {
    const loading = ref(false)
    const searchUserId = ref('')
    const historyList = ref([])
    const searchError = ref('')
    
    // 筛选条件
    const dateRange = ref('')
    const filterRewardName = ref('')
    
    const currentRecord = ref({
      id: null,
      user_id: null,
      reward_id: null,
      reward_name: '',
      points_spent: 0,
      created_at: '',
      notes: ''
    })
    
    // 属性过滤页面
    const filteredHistory = computed(() => {
      return historyList.value.filter(item => {
        // 日期过滤
        // 选择两个日期
        // 显示日期范围内的记录
        if (dateRange.value && dateRange.value.length === 2) {
          const startDate = new Date(dateRange.value[0])
          const endDate = new Date(dateRange.value[1])
          endDate.setDate(endDate.getDate() + 1) // 包含结束日期
          
          const itemDate = new Date(item.created_at)
          if (itemDate < startDate || itemDate >= endDate) {
            return false
          }
        }
        
        // 物品名称过滤
        // 如果输入了物品名称，则只显示包含该名称的记录
        if (filterRewardName.value && 
            !item.reward_name.toLowerCase().includes(filterRewardName.value.toLowerCase())) {
          return false
        }
        
        return true
      })
    })
    
    // 计算总消耗积分
    const totalPointsSpent = computed(() => {
      return historyList.value.reduce((sum, item) => sum + item.points_spent, 0)
    })
    
    // 计算兑换物品种类数
    const uniqueRewards = computed(() => {
      const rewards = new Set()
      historyList.value.forEach(item => rewards.add(item.reward_name))
      return rewards.size
    })

    // 搜索历史记录
    // 1.搜索框为空时，无法点击“搜索”按钮
    // 2.搜索框有内容时，向后端发送相应用户ID查询
    // 3.接受后端响应
    const searchHistory = async () => {

      historyList.value = []
      searchError.value = ''
      loading.value = true

      try {
        const userId = searchUserId.value.trim()
        const response = await axios.get(
          `${baseURL}/api/points/rewards/history/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        )
        historyList.value = response.data
      } catch (error) {
        if (error.response?.status === 404) {
          searchError.value = '未搜索到该用户的兑换历史记录'
        } else {
          searchError.value = `搜索失败: ${error.response?.data?.message || error.message}`
        }
      } finally {
        loading.value = false
      }
    }
    
    // 重置搜索
    const resetSearch = () => {
      searchUserId.value = ''
      dateRange.value = ''
      filterRewardName.value = ''
      historyList.value = []
      searchError.value = ''
    }
    
    return {
      loading,
      searchUserId,
      historyList,
      searchError,
      dateRange,
      filterRewardName,
      currentRecord,
      filteredHistory,
      totalPointsSpent,
      uniqueRewards,
      searchHistory,
      resetSearch,
    }
  }
}
</script>

<style scoped>
.reward-history {
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}


.search-box {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 300px;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.date-picker {
  width: 300px;
}

.reward-filter {
  width: 250px;
}

.result-container {
  margin-top: 20px;
}

.error-message {
  margin-top: 20px;
  color: #f56c6c;
  text-align: center;
  font-weight: bold;
}

.search-button {
  min-width: 40px;
  color: #071102 !important;
}

.search-button:hover {
  background-color: #5daf34 !important;
  border-color: greenyellow !important;
  color: rgb(255, 255, 255) !important;
}

.search-button.is-disabled {
  background-color: #a0c97f;
  border-color: #a0c97f;
  color: #f5f5f5;
  opacity: 0.6;
}

.reset-button {
  min-width: 40px;
  background-color: #909399 !important;
  border-color: #909399 !important;
  color: white !important;
}

.reset-button:hover {
  background-color: #a6a9ad !important;
  border-color: #a6a9ad !important;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #409eff;
}

.no-data {
  margin-top: 40px;
}

.summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fdf6ec;
  border-radius: 8px;
  border: 1px solid #f5dab1;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #e6a23c;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-box {
    width: 100%;
    margin-top: 15px;
  }
  
  .search-input {
    width: 100%;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .date-picker, .reward-filter {
    width: 100%;
  }
  
  .summary {
    flex-direction: column;
    gap: 10px;
  }
}
</style>