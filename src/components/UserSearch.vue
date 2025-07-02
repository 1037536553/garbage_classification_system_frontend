<template>
  <div class="user-search">
    <el-input 
      v-model="searchKeyword"
      placeholder="请输入用户ID"
      clearable
      @keyup.enter="searchUser"
    >
      <template #append>
        <el-button 
          type="success" 
          @click="searchUser"
          :disabled="!searchKeyword || !searchKeyword.trim()"
          class="search-button"
        >搜索</el-button>
      </template>
    </el-input>
    
    <div class="result-container" v-if="searchResult">
      <el-table :data="[searchResult]" border style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="用户ID" width="100" />
        <el-table-column prop="username" label="登录名" width="150" />
        <el-table-column prop="role" label="权限" width="100">
          <template #default="{ row }">
            {{ row.role === 0 ? '普通用户' : '管理员' }}
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? '正常' : '封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="openEditDialog(row)"
            >
              修改
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div v-if="searchError" class="error-message">
      {{ searchError }}
    </div>
    
    <!-- 用户编辑对话框 -->
    <el-dialog v-model="showEditDialog" title="修改用户信息" width="500px">
      <el-form :model="currentEditItem" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model.number="currentEditItem.id" disabled />
        </el-form-item>
        <el-form-item label="登录名">
          <el-input v-model="currentEditItem.username" disabled />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input 
            v-model="newPassword" 
            type="password"
            show-password
            placeholder="输入新密码"
          />
        </el-form-item>
        <el-form-item label="权限">
          <el-input 
            :value="roleDisplay" 
            disabled 
          />
          <div class="permission-hint">
            <el-icon><Warning /></el-icon>
            <span>权限级别需在数据库直接修改</span>
          </div>
        </el-form-item>
        <el-form-item label="积分">
          <el-input 
            v-model.number="currentEditItem.points" 
            disabled
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model.number="currentEditItem.status" placeholder="请选择">
            <el-option :label="'正常'" :value="0" />
            <el-option :label="'封禁'" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="updateUser">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  components: {
    Warning
  },
  setup() {
    const searchKeyword = ref('')
    const searchResult = ref(null)
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
    
    const searchUser = async () => {
      if (!searchKeyword.value || !searchKeyword.value.trim()) return;
      
      searchResult.value = null;
      searchError.value = '';
      
      try {
        // 调用获取用户详情接口
        const response = await axios.get(
          `/api/admin/users/${searchKeyword.value.trim()}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
            }
          }
        );
        
        searchResult.value = response.data;
      } catch (error) {
        if (error.response?.status === 404) {
          searchError.value = '未查询到用户，请检查用户ID是否正确';
        } else {
          searchError.value = `查询失败: ${error.response?.data?.message || error.message}`;
        }
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
        const response = await axios.put(
          `/api/admin/users/${userId}/status`,
          { status: newStatus },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
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
    
    // 更新用户密码
    const updateUserPassword = async (userId, newPassword) => {
      try {
        const response = await axios.put(
          `/api/admin/users/${userId}/set_password`,
          { new_password: newPassword },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
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
          searchResult.value = updatedUser;
        }
        
        showEditDialog.value = false;
        newPassword.value = '';
      } catch (error) {
        // 错误处理已在各自函数中完成
      }
    };
    
    return {
      searchKeyword,
      searchResult,
      searchError,
      showEditDialog,
      currentEditItem,
      newPassword,
      roleDisplay,
      searchUser,
      openEditDialog,
      updateUser
    }
  }
}
</script>


<style scoped>
.user-search {
  padding: 20px;
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
</style>