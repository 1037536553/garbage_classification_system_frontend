<template>
  <div class="stats-container">
    <h3 class="stats-title">所有用户识别历史统计</h3>
    
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" style="font-size: 24px;">
        <Loading />
      </el-icon>
      <span>加载中...</span>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="statsData.length > 0" class="charts-container">
      <div class="chart-wrapper">
        <div class="chart-title">分类分布（饼图）</div>
        <div ref="pieChart" class="chart"></div>
      </div>
      
      <div class="chart-wrapper">
        <div class="chart-title">分类数量（柱状图）</div>
        <div ref="barChart" class="chart"></div>
      </div>
    </div>

    <div v-if="!loading && statsData.length === 0 && !error" class="no-data">
      <el-empty description="暂无统计信息" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import axios from 'axios';
import { baseURL } from '/src/config.js';
import * as echarts from 'echarts';

export default {
  components: {
    Loading
  },
  setup() {
    const statsData = ref([]);
    const loading = ref(false);
    const error = ref('');
    const pieChart = ref(null);
    const barChart = ref(null);
    let pieInstance = null;
    let barInstance = null;

    const fetchStats = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const response = await axios.get(
          `${baseURL}/api/history/stats`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        );
        statsData.value = response.data;
        
        // 确保DOM更新后初始化图表
        nextTick(() => {
          initPieChart();
          initBarChart();
        });
      } catch (err) {
        error.value = `获取统计信息失败: ${err.response?.data?.message || err.message}`;
        ElMessage.error(error.value);
      } finally {
        loading.value = false;
      }
    };

    const initPieChart = () => {
      if (!pieChart.value || statsData.value.length === 0) return;
      
      if (pieInstance) {
        pieInstance.dispose();
      }
      
      pieInstance = echarts.init(pieChart.value);
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          data: statsData.value.map(item => item.category)
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
            data: statsData.value.map(item => ({
              name: item.category,
              value: item.count
            }))
          }
        ]
      };
      
      pieInstance.setOption(option);
      
      // 响应窗口大小变化
      window.addEventListener('resize', () => {
        pieInstance.resize();
      });
    };

    const initBarChart = () => {
      if (!barChart.value || statsData.value.length === 0) return;
      
      if (barInstance) {
        barInstance.dispose();
      }
      
      barInstance = echarts.init(barChart.value);
      
      // 按数量降序排序
      const sortedData = [...statsData.value].sort((a, b) => b.count - a.count);
      
      const option = {
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
          data: sortedData.map(item => item.category),
          axisLabel: {
            interval: 0,
            rotate: 0
          }
        },
        series: [
          {
            name: '数量',
            type: 'bar',
            data: sortedData.map(item => item.count),
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
      };
      
      barInstance.setOption(option);
      
      // 响应窗口大小变化
      window.addEventListener('resize', () => {
        barInstance.resize();
      });
    };

    onMounted(() => {
      fetchStats();
    });

    return {
      statsData,
      loading,
      error,
      pieChart,
      barChart
    };
  }
};
</script>

<style scoped>
.stats-container {
  margin-top: 40px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stats-title {
  color: #409eff;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.charts-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.chart-wrapper {
  flex: 1;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #409eff;
}

.error-message {
  margin-top: 20px;
  color: #f56c6c;
  text-align: center;
  font-weight: bold;
}

.no-data {
  margin-top: 40px;
}

@media (max-width: 992px) {
  .charts-container {
    flex-direction: column;
  }
}
</style>