<template>
  <div id="app">
    <div class="header">
    <h1>垃圾分类系统 - 管理员模块</h1>
    <div class="login-container" v-if="!isLoggedIn">
      <el-input v-model="loginForm.username" 
        placeholder="用户名" 
        size="small" 
        style="width: 120px; margin-right: 10px;"></el-input>
        <el-input v-model="loginForm.password" 
        placeholder="密码" 
        size="small" 
        style="width: 120px; margin-right: 10px;"
        @keyup.enter="handleLogin"></el-input>
        <el-button 
        type="primary" 
        size="small" 
        @click="handleLogin"
        >登录</el-button>
      </div>
      <div class="user-info" v-else>
        <span>欢迎，管理员 {{ loginForm.username }}！</span>
          <el-button 
          type="danger" 
          size="small" 
          @click="handleLogout" 
          style="margin-left: 10px;"
          >退出</el-button>
      </div>
      <AdminPage v-if="isLoggedIn" :token="token" />
      <div v-else class="login-prompt">
        <el-empty description="请先登录管理员账号" />
      </div>
    </div>
  </div>
</template>

<script>
import AdminPage from '/src/components/AdminPage.vue'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'App',
  components: {
    AdminPage
  },
  setup() {
    const loginForm = ref({
      username: '',
      password: ''
    })
    
    const isLoggedIn = ref(false)
    const token = ref('')
    
    // 检查本地存储是否有登录信息
    const checkLocalStorage = () => {
      const savedToken = localStorage.getItem('adminToken')
      const savedUsername = localStorage.getItem('adminUsername')
      
      if (savedToken && savedUsername) {
        isLoggedIn.value = true
        loginForm.value.username = savedUsername
        token.value = savedToken
      }
    }
    
    // 初始检查
    checkLocalStorage()
    
    const handleLogin = async () => {
      if (!loginForm.value.username || !loginForm.value.password) {
        ElMessage.warning('请输入用户名和密码')
        return
      }
      
      try {
        const response = await fetch('http://10.242.22.231:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: loginForm.value.username,
            password: loginForm.value.password
          })
        })
        
        const data = await response.json()
        
        if (response.status === 200) {
          if (data.role === 1) {
            // 管理员登录成功
            isLoggedIn.value = true
            token.value = data.token
            
            // 保存到本地存储
            localStorage.setItem('adminToken', data.token)
            localStorage.setItem('adminUsername', loginForm.value.username)
            
            ElMessage.success('管理员登录成功')
          } else {
            ElMessage.warning('普通用户无法登录管理员系统')
          }
        } else if (response.status === 401) {
          ElMessage.error('用户名或密码错误')
        } else if (response.status === 403) {
          ElMessage.error('该账户已被封禁，请联系管理员')
        } else {
          ElMessage.error(`登录失败: ${data.message || '未知错误'}`)
        }
      } catch (error) {
        console.error('登录请求失败:', error)
        ElMessage.error('网络错误，无法连接到服务器')
      }
    }
    
    const handleLogout = () => {
      isLoggedIn.value = false
      token.value = ''
      loginForm.value.password = ''
      
      // 清除本地存储
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUsername')
      
      ElMessage.success('已退出登录')
    }
    
    return {
      loginForm,
      isLoggedIn,
      token,
      handleLogin,
      handleLogout
    }
  }
}

</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

.login-container {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  font-weight: bold;
  color: #409EFF;
}

.login-prompt {
  margin-top: 100px;
  text-align: center;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}
</style>

