[file name]: UserSearch.vue
[file content begin]
<template>
  <div class="user-search">
    <div class="search-container">
      <el-input v-model="searchKeyword" placeholder="请输入用户ID（留空则获取所有用户）" clearable @keyup.enter="searchUser"
        style="flex: 1">
        <template #prepend>
          <el-icon>
            <User />
          </el-icon>
        </template>
      </el-input>
      <el-button type="success" @click="searchUser" :disabled="loading" class="search-button"
        style="margin-left: 10px;">
        <el-icon>
          <Search />
        </el-icon>搜索
      </el-button>
    </div>

    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" style="font-size: 24px;">
        <el-icon-loading />
      </el-icon>
      <span>查询中...</span>
    </div>

    <div v-if="searchError" class="error-message">
      {{ searchError }}
    </div>

    <div class="result-container" v-if="searchResult">
      <el-table :data="searchResult" border style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="用户ID" width="100" sortable />
        <el-table-column prop="username" label="登录名" sortable />
        <!-- <el-table-column prop="userpassword" label="密码"  /> -->
        <el-table-column prop="role" label="权限" sortable>
          <template #default="{ row }">
            {{ row.role === 0 ? '普通用户' : '管理员' }}
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" sortable />
        <el-table-column prop="status" label="状态" sortable>
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? '正常' : '封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)">
              修改
            </el-button>
            <!-- 新增识别历史按钮 -->
            <el-button 
            type="success" 
            size="small" 
            @click="goToRecognitionHistory(row.id)">
              识别历史
            </el-button>
            <!-- 新增兑换历史按钮 -->
            <el-button 
            type="warning" 
            size="small" 
            @click="goToRewardHistory(row.id)">
              兑换历史
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="!loading && searchResult.length === 0 && !searchError" class="no-data">
      <el-empty description="暂无数据" />
    </div>

    <!-- 管理员编辑对话框 -->
    <el-dialog v-model="showEditDialog" title="修改用户信息" width="500px">
      <el-form :model="currentEditItem" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model.number="currentEditItem.id" disabled />
        </el-form-item>
        <el-form-item label="登录名">
          <el-input v-model="currentEditItem.username" disabled />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="newPassword" type="password" show-password placeholder="输入新密码" />
        </el-form-item>
        <el-form-item label="权限">
          <el-input :value="roleDisplay" disabled />
          <div class="permission-hint">
            <el-icon>
              <Warning />
            </el-icon>
            <span>权限级别需在数据库直接修改</span>
          </div>
        </el-form-item>
        <el-form-item label="积分">
          <el-input v-model.number="currentEditItem.points" disabled />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model.number="currentEditItem.status" placeholder="请选择" :disabled="isAdminUser(currentEditItem)">
            <el-option :label="'正常'" :value="0" />
            <el-option :label="'封禁'" :value="1" />
          </el-select>
          <div v-if="isAdminUser(currentEditItem)" class="permission-hint">
            <el-icon>
              <Warning />
            </el-icon>
            <span>管理员账号不可封禁</span>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="updateUser">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Loading, User, Search } from '@element-plus/icons-vue'
import axios from 'axios'
import { baseURL } from '/src/config.js'
import { useRouter } from 'vue-router'
export default {
  components: {
    Warning,
    Loading,
    User,
    Search
  },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const searchKeyword = ref('')
    const searchResult = ref([])
    const searchError = ref('')
    const showEditDialog = ref(false)
    const currentEditItem = ref({
      id: null,
      username: '',
      role: 0,
      points: 0,
      status: 0
    })
    const newPassword = ref('')
    const originalStatus = ref(0)
    
    // 计算权限显示文本
    const roleDisplay = computed(() => {
      return currentEditItem.value.role === 0 ? '普通用户' : '管理员'
    })



    // 用户名模糊搜索
    const filterUsers = (users, keyword) => {
      if (!keyword) return users;
      
      // 解析逻辑运算符
      const tokens = keyword.split(/(&&|\|\|)/).filter(token => token.trim());
      
      // 如果没有运算符，则将空格替换为&&，使用AND逻辑
      if (tokens.length === 1) {
        return users.filter(user => 
      user.username.toLowerCase().includes(tokens[0].toLowerCase()));
      }

      
      // 处理逻辑运算
      let result = [...users];
      let currentOperator = '&&'; // 默认AND逻辑
      
      tokens.forEach(token => {
        if (token === '&&' || token === '||') {
          currentOperator = token;
        } else {
          const term = token.toLowerCase();
          if (currentOperator === '&&') {
            result = result.filter(user => 
              user.username.toLowerCase().includes(term))
          } else if (currentOperator === '||') {
            const newMatches = users.filter(user => 
              user.username.toLowerCase().includes(term) && 
              !result.some(r => r.id === user.id))
            result = [...result, ...newMatches];
          }
        }
      });
      
      return result;
    };
    
    // 预处理关键词：将空格替换为&&，并移除运算符周围的空格
    const preprocessKeyword = (keyword) => {
      // 1. 移除逻辑运算符周围的空格
      let processed = keyword.replace(/\s*(&&|\|\|)\s*/g, '$1');

      // 2. 将剩余的空格替换为&&
      processed = processed.replace(/\s+/g, '&&');

      return processed;
    };
    // 搜索用户
    // 1.检测搜索框是否为空
    // 2.空搜索框get获取所有用户；否则get获取指定id用户
    // 3.如果用户不存在，显示错误信息
    const searchUser = async () => {
      // 清空上一次结果
      searchResult.value = [];
      searchError.value = '';
      loading.value = true; // 开始加载状态
      
      try {
        if (!searchKeyword.value || !searchKeyword.value.trim()) {
          // 如果没有输入关键词，则获取所有用户
          const response = await axios.get(
            `${baseURL}/api/admin/users`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
              }
            }
          )
          searchResult.value = response.data;
        } else {
          // 首先尝试按ID精确搜索
          const idSearch = /^\d+$/.test(searchKeyword.value.trim());
          if (idSearch) {
            // 按ID精确搜索
            const response = await axios.get(
              `${baseURL}/api/admin/users/${searchKeyword.value.trim()}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
              }
            );
            searchResult.value = [response.data];
          } else {
            // 模糊搜索：获取所有用户然后过滤
            const response = await axios.get(
              `${baseURL}/api/admin/users`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
              }
            );
            const allUsers = response.data;
            const processedKeyword = preprocessKeyword(searchKeyword.value.trim());
            searchResult.value = filterUsers(allUsers, processedKeyword);
          }
        }

      } catch (error) {
        if (error.response?.status === 404) {
          searchError.value = '未查询到用户，请检查用户ID是否正确';
        } else {
          searchError.value = `查询失败: ${error.response?.data?.message || error.message}`;
        }
      }finally{
        // 结束加载
        loading.value=false
      }
    };


    
    // 打开编辑对话框
    const openEditDialog = (user) => {
      currentEditItem.value = { ...user };
      originalStatus.value = user.status;
      newPassword.value = '';
      showEditDialog.value = true;
    };
    
    // 更新用户状态
    const updateUserStatus = async (userId, newStatus) => {
      try {
        // 检查是否为管理员用户
        const targetUser = searchResult.value.find(u => u.id === userId);
        if (targetUser && targetUser.role === 1) {
          ElMessage.warning('管理员账号不可封禁');
          return targetUser; // 返回未修改的用户信息
        }


        const response = await axios.put(
          `${baseURL}/api/admin/users/${userId}/status`,
          { status: newStatus },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        );
        
        ElMessage.success(response.data.message);
        return response.data.user;
      } catch (error) {
        ElMessage.error(`状态更新失败: ${error.response?.data?.message || error.message}`);
        throw error;
      }
    };

    // 检查是否为管理员用户
    const isAdminUser = (user) => {
      return user.role === 1; // 1表示管理员
    };
    
    // 更新用户密码
    // 1.如果输入了新密码，则向后端发送PUT请求更新密码
    // 2.如果没有输入新密码，则不更新密码
    const updateUserPassword = async (userId, newPassword) => {
      try {
        const response = await axios.put(
          `${baseURL}/api/admin/users/${userId}/set_password`,
          { new_password: newPassword },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        );
        
        ElMessage.success(response.data.message);
      } catch (error) {
        ElMessage.error(`密码更新失败: ${error.response?.data?.message || error.message}`);
        throw error;
      }
    };
    
    // 更新用户信息
    const updateUser = async () => {
      try {
        // 1. 更新密码（如果输入了新密码）
        if (newPassword.value) {
          await updateUserPassword(currentEditItem.value.id, newPassword.value);
        }
        
        // 2. 更新状态（如果状态有变化）
        if (currentEditItem.value.status !== originalStatus.value) {
          const updatedUser = await updateUserStatus(
            currentEditItem.value.id, 
            currentEditItem.value.status
          );
          
          // 更新本地数据
          const index = searchResult.value.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            const newResults = [...searchResult.value];
            newResults[index] = updatedUser;
            searchResult.value = newResults;
          }
        }
        
        showEditDialog.value = false;
        newPassword.value = '';
      } catch (error) {
        // 错误处理已在各自函数中完成
      }
    };
    // 新增：跳转到识别历史页面
    const goToRecognitionHistory = (userId) => {
      router.push({
        path: '/history',
        query: { user_id: userId }
      })
    }

    // 新增：跳转到兑换历史页面
    const goToRewardHistory = (userId) => {
      router.push({
        path: '/reward',
        query: { user_id: userId }
      })
    }
    
    return {
      loading,
      searchKeyword,
      searchResult,
      searchError,
      showEditDialog,
      currentEditItem,
      newPassword,
      roleDisplay,
      searchUser,
      openEditDialog,
      updateUser,
      isAdminUser,
      goToRecognitionHistory,
      goToRewardHistory
    }

  }
}
</script>


<style scoped>
.user-search {
  padding: 20px;
}

.search-container {
  display: flex;
  align-items: center;
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

.el-button--small{
    padding: 5px 10px;
    font-size: 12px;
}

/* 权限提示样式 */
.permission-hint {
  margin-top: 8px;
  padding: 6px 12px;
  background-color: #f0f9ff;
  border-radius: 4px;
  color: #409eff;
  display: flex;
  align-items: center;
  font-size: 12px;
}

.permission-hint .el-icon {
  margin-right: 6px;
  font-size: 14px;
}

.loading-container{
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #409eff;
}

.no-data{
  margin-top: 40px;
}
</style>