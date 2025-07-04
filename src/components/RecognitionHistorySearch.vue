<template>
  <div class="history-search">
    <div class="header">
      <div class="search-container">
        <el-input v-model="searchUserId" placeholder="请输入用户ID（必填）" clearable @keyup.enter="searchHistory"
          class="search-input" style="flex: 1">
          <template #prepend>
            <el-icon>
              <User />
            </el-icon>
          </template>
        </el-input>
        <el-button type="success" 
        @click="searchHistory" 
        :disabled="loading || !searchUserId" 
        class="search-button"
          style="margin-left: 10px;">
          <el-icon>
            <Search />
          </el-icon>
          搜索
        </el-button>
      </div>
    </div>
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" style="font-size: 24px;">
        <Loading />
      </el-icon>
      <span>查询中...</span>
    </div>

    <div v-if="searchError" class="error-message">
      {{ searchError }}
    </div>

    <div class="result-container" v-if="historyData.length > 0">
      <el-table :data="historyData" border style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="记录ID" width="100" sortable />
        <el-table-column prop="user_id" label="用户ID" width="80" />
        <el-table-column prop="query_type" label="查询方式" width="110" sortable>
          <template #default="{ row }">
            {{ row.query_type === 'text' ? '文字查询' : '图片查询' }}
          </template>
        </el-table-column>
        <el-table-column prop="query_content" label="查询内容" sortable />
        <el-table-column prop="result_category" label="分类结果" width="110" sortable />
        <el-table-column prop="created_at" label="查询时间" sortable />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? '正常' : '已删除' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="!loading && historyData.length === 0 && !searchError && searched" class="no-data">
      <el-empty description="该用户暂无识别记录" />
    </div>

    <div class="stats-container" v-if="historyData.length > 0">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ historyData.length }}</div>
            <div class="stat-label">总记录数</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ activeRecords }}</div>
            <div class="stat-label">有效记录</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ deletedRecords }}</div>
            <div class="stat-label">已删除记录</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ uniqueCategories }}</div>
            <div class="stat-label">不同分类数</div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, User, Search } from '@element-plus/icons-vue'
import axios from 'axios'
import { baseURL } from '/src/config.js'

export default {
  components: {
    Loading,
    User,
    Search
  },
  setup(props) {
    const loading = ref(false)
    const searchUserId = ref('')
    const historyData = ref([])
    const searchError = ref('')
    const searched = ref(false)
    
    const searchHistory = async () => {
      if (!searchUserId.value) {
        ElMessage.warning('请输入用户ID')
        return
      }
      
      historyData.value = []
      searchError.value = ''
      loading.value = true
      searched.value = true
      
      try {
        const response = await axios.get(
          `${baseURL}/api/history/user/${searchUserId.value}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        )
        historyData.value = response.data
      } catch (error) {
        if (error.response?.status === 404) {
          searchError.value = '未找到该用户的识别记录'
        } else {
          searchError.value = `查询失败: ${error.response?.data?.message || error.message}`
        }
      } finally {
        loading.value = false
      }
    }
    
    // 计算统计数据
    const activeRecords = computed(() => {
      return historyData.value.filter(item => item.status === 0).length
    })
    
    const deletedRecords = computed(() => {
      return historyData.value.filter(item => item.status === 1).length
    })
    
    const uniqueCategories = computed(() => {
      const categories = new Set()
      historyData.value.forEach(item => {
        categories.add(item.result_category)
      })
      return categories.size
    })
    
    return {
      loading,
      searchUserId,
      historyData,
      searchError,
      searched,
      activeRecords,
      deletedRecords,
      uniqueCategories,
      searchHistory,
    }
  }
}
</script>

<style scoped>
.history-search {
  padding: 20px;
}

.search-container {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

.stats-container {
  margin-top: 30px;
}

.stat-card {
  text-align: center;
  border-radius: 8px;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.search-input {
  width: 300px;
}

</style>