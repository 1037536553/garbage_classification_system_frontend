<!-- src/views/MainLayout.vue -->
<template>
  <div class="main-layout">
    <div class="header">
      <div class="logo">垃圾分类系统 - 管理员模块</div>
      <div class="user-info">
        <span>欢迎，管理员 {{ username }}！</span>
        <el-button type="danger" size="small" @click="handleLogout" style="margin-left: 15px;">退出</el-button>
      </div>
    </div>

    <div class="admin-tabs">
      <el-button :type="isActive('user')" @click="navigateTo('/user')">
        用户查询
      </el-button>
      <el-button :type="isActive('article')" @click="navigateTo('/article')">
        文章管理
      </el-button>
      <el-button :type="isActive('history')" @click="navigateTo('/history')">
        识别历史
      </el-button>
      <el-button :type="isActive('reward')" @click="navigateTo('/reward')">
        兑换历史
      </el-button>
    </div>

    <div class="main-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const username = ref(localStorage.getItem('adminUsername') || '管理员')
    
    // 检查当前路由
    const isActive = (path) => {
      return route.path.includes(path) ? 'primary' : ''
    }
    
    // 导航到指定路径
    const navigateTo = (path) => {
      router.push(path)
    }
    
    // 退出逻辑
    const handleLogout = () => {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUsername')
      localStorage.clear()
      ElMessage.success('已退出登录')
      // 重定向到登录页面
      router.push('/')
    }
    
    return {
      username,
      isActive,
      navigateTo,
      handleLogout
    }
  }
}
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: #409eff;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo {
  font-size: 18px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
}

.admin-tabs {
  display: flex;
  padding: 15px 30px;
  background: white;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background-color: #f5f7fa;
}
</style>