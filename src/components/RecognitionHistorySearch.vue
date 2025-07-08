<template>
  <div class="history-search">
    <div class="header">
      <div class="search-container">
        <el-input 
        v-model="searchUserId" 
        placeholder="请输入用户ID（必填）" 
        clearable 
        @keyup.enter="searchHistory"
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
        <el-table-column prop="query_content" label="查询内容" sortable>
          <template #default="{ row }">
            <span v-if="row.query_type === 'text'">{{ row.query_content }}</span>
            <a v-else href="javascript:void(0)" @click="showImage(row.query_content)" style="color: #409eff; text-decoration: underline;">
              {{ row.query_content }}
            </a>
          </template>
        </el-table-column>
        <el-table-column prop="result_category" label="分类结果" width="110" sortable />
        <el-table-column prop="created_at" label="查询时间" sortable />
        <el-table-column prop="status" label="状态" width="80" sortable>
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
    
    <!-- 新增图表区域 -->
    <div v-if="historyData.length > 0" class="charts-container">
      <div class="chart-wrapper">
        <div class="chart-title">分类分布（饼图）</div>
        <div ref="pieChart" class="chart"></div>
      </div>
      
      <div class="chart-wrapper">
        <div class="chart-title">分类数量（柱状图）</div>
        <div ref="barChart" class="chart"></div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="imageDialogVisible" title="识别图片" width="50%" @close="closeImageDialog">
      <div style="text-align: center; min-height: 200px;">
        <div v-if="imageLoading" class="image-loading">
          <el-icon class="is-loading" style="font-size: 24px;">
            <Loading />
          </el-icon>
          <span>图片加载中...</span>
        </div>
        <img 
          v-if="imageUrl" 
          :src="imageUrl" 
          style="max-width: 100%; max-height: 70vh; display: block; margin: 0 auto;" 
          @load="imageLoading = false"
          @error="handleImageError"
          alt="识别图片"
        />
        <div v-if="imageError" class="error-message">
          {{ imageError }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, User, Search } from '@element-plus/icons-vue'
import axios from 'axios'
import { baseURL } from '/src/config.js'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'

export default {
  components: {
    Loading,
    User,
    Search
  },
  setup() {
    const route = useRoute()
    const loading = ref(false)
    const searchUserId = ref('')
    const historyData = ref([])
    const searchError = ref('')
    const searched = ref(false)
    
    // 新增图表相关变量
    const pieChart = ref(null)
    const barChart = ref(null)
    let pieInstance = null
    let barInstance = null

    // 图片预览相关变量
    const imageDialogVisible = ref(false)
    const imageLoading = ref(false)
    const imageUrl = ref('')
    const imageError = ref('')

    // 自动搜索
    const autoSearch = () =>{
      if(route.query.user_id){
        searchUserId.value = route.query.user_id
        searchHistory()
      }
    }

    onMounted(()=>{
      autoSearch()
    })
    
    // 搜索用户识别记录
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
        
        // 数据加载完成后初始化图表
        nextTick(() => {
          initCharts()
        })
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
    
    // 显示图片
    const showImage = async (filename) => {
      // 重置状态
      imageLoading.value = true
      imageUrl.value = ''
      imageError.value = ''
      imageDialogVisible.value = true
      
      try {
        const response = await axios.get(
          `${baseURL}/api/recognize/uploads/${encodeURIComponent(filename)}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            responseType: 'blob' // 指定响应类型为二进制数据
          }
        )
        
        // 创建Blob URL
        const blob = new Blob([response.data])
        imageUrl.value = URL.createObjectURL(blob)
      } catch (error) {
        imageError.value = `获取图片失败: ${error.response?.data?.message || error.message}`
        imageLoading.value = false
      }
    }
    
    // 关闭图片对话框
    const closeImageDialog = () => {
      // 释放Blob URL资源
      if (imageUrl.value) {
        URL.revokeObjectURL(imageUrl.value)
        imageUrl.value = ''
      }
    }
    
    // 处理图片加载错误
    const handleImageError = () => {
      imageLoading.value = false
      imageError.value = '图片加载失败，请重试'
    }
    
    // 有效记录统计
    const activeRecords = computed(() => {
      return historyData.value.filter(item => item.status === 0).length 
    })
    
    // 删除记录统计
    const deletedRecords = computed(() => {
      return historyData.value.filter(item => item.status === 1).length
    })
    
    // 不同分类数统计
    const uniqueCategories = computed(() => {
      const categories = new Set()
      historyData.value.forEach(item => {
        categories.add(item.result_category)
      })
      return categories.size
    })
    
    // 新增：计算分类统计数据
    const categoryStats = computed(() => {
      const stats = {}
      historyData.value.forEach(item => {
        if (item.status === 0) { // 只统计有效记录
          const category = item.result_category || '未知'
          stats[category] = (stats[category] || 0) + 1
        }
      })
      
      return Object.entries(stats).map(([category, count]) => ({
        category,
        count
      })).sort((a, b) => b.count - a.count) // 按数量降序排序
    })
    
    // 初始化图表
    const initCharts = () => {
      if (categoryStats.value.length === 0) return
      
      // 初始化饼图
      if (pieChart.value) {
        if (pieInstance) {
          pieInstance.dispose()
        }
        pieInstance = echarts.init(pieChart.value)
        
        const pieOption = {
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            data: categoryStats.value.map(item => item.category)
          },
          series: [
            {
              name: '分类统计',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '18',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: categoryStats.value.map(item => ({
                name: item.category,
                value: item.count
              }))
            }
          ]
        }
        
        pieInstance.setOption(pieOption)
      }
      
      // 初始化柱状图
      if (barChart.value) {
        if (barInstance) {
          barInstance.dispose()
        }
        barInstance = echarts.init(barChart.value)
        
        const barOption = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'value',
            name: '数量'
          },
          yAxis: {
            type: 'category',
            name: '分类',
            data: categoryStats.value.map(item => item.category),
            axisLabel: {
              interval: 0,
              rotate: 0
            }
          },
          series: [
            {
              name: '数量',
              type: 'bar',
              data: categoryStats.value.map(item => item.count),
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#83bff6' },
                  { offset: 0.5, color: '#188df0' },
                  { offset: 1, color: '#188df0' }
                ])
              },
              emphasis: {
                itemStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#2378f7' },
                    { offset: 0.7, color: '#2378f7' },
                    { offset: 1, color: '#83bff6' }
                  ])
                }
              }
            }
          ]
        }
        
        barInstance.setOption(barOption)
      }
      
      // 添加窗口大小变化监听器
      window.addEventListener('resize', handleResize)
    }
    
    // 处理窗口大小变化
    const handleResize = () => {
      if (pieInstance) {
        pieInstance.resize()
      }
      if (barInstance) {
        barInstance.resize()
      }
    }
    
    // 监听数据变化
    watch(categoryStats, () => {
      initCharts()
    })
    
    // 组件卸载时清理
    onMounted(() => {
      window.addEventListener('resize', handleResize)
    })
    
    onUnmounted(() => {
      // 释放图表资源
      if (pieInstance) {
        pieInstance.dispose()
        pieInstance = null
      }
      if (barInstance) {
        barInstance.dispose()
        barInstance = null
      }
      // 释放图片资源
      if (imageUrl.value) {
        URL.revokeObjectURL(imageUrl.value)
      }
      // 移除事件监听
      window.removeEventListener('resize', handleResize)
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
      pieChart,
      barChart,
      // 图片预览相关
      imageDialogVisible,
      imageLoading,
      imageUrl,
      imageError,
      showImage,
      closeImageDialog,
      handleImageError
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

/* 新增图表样式 */
.charts-container {
  display: flex;
  gap: 20px;
  margin-top: 40px;
}

.chart-wrapper {
  flex: 1;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: white;
}

.chart-title {
  text-align: center;
  font-weight: bold;
  margin-bottom: 15px;
  color: #606266;
}

.chart {
  height: 400px;
  width: 100%;
}

@media (max-width: 992px) {
  .charts-container {
    flex-direction: column;
  }
}

/* 图片加载样式 */
.image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #409eff;
}
</style>