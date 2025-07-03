<!-- src/views/LoginPage.vue -->
<template>
  <div class="login-container">
    <h1>垃圾分类系统 - 管理员登录</h1>
    <div class="login-form">
      <el-input 
        v-model="loginForm.username" 
        placeholder="用户名" 
        size="large"
        class="login-input"
      ></el-input>
      <el-input 
        v-model="loginForm.password" 
        placeholder="密码" 
        type="password"
        size="large"
        class="login-input"
        @keyup.enter="handleLogin"
      ></el-input>
      <el-button 
        type="primary" 
        size="large" 
        @click="handleLogin"
        class="login-button"
      >登录</el-button>
      
      <div v-if="loginError" class="error-message">
        {{ loginError }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { baseURL } from '/src/config.js'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const loginForm = ref({
      username: '',
      password: ''
    })
    
    const loginError = ref('')
    const router = useRouter()
    
    const handleLogin = async () => {
      if (!loginForm.value.username || !loginForm.value.password) {
        ElMessage.warning('请输入用户名和密码')
        return
      }
      
      try {
        const response = await fetch(`${baseURL}/api/auth/login`, {
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
            localStorage.setItem('adminToken', data.token)
            localStorage.setItem('adminUsername', loginForm.value.username)
            
            ElMessage.success('管理员登录成功')
            router.push('/user')
          } else {
            loginError.value = '普通用户无法登录管理员系统'
          }
        } else if (response.status === 401) {
          loginError.value = '用户名或密码错误'
        } else if (response.status === 403) {
          loginError.value = '该账户已被封禁，请联系管理员'
        } else {
          loginError.value = `登录失败: ${data.message || '未知错误'}`
        }
      } catch (error) {
        console.error('登录请求失败:', error)
        loginError.value = '网络错误，无法连接到服务器'
      }
    }
    
    return {
      loginForm,
      loginError,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.login-form {
  width: 350px;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-input {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
}

.error-message {
  margin-top: 15px;
  color: #f56c6c;
  text-align: center;
  font-weight: bold;
}

h1 {
  margin-bottom: 30px;
  color: #409eff;
}
</style>