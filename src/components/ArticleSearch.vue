<template>
  <div class="article-search">
    <div class="search-container">
      <el-input v-model="searchKeyword" placeholder="请输入文章ID（留空则获取所有文章）" clearable @keyup.enter="searchArticles"
        style="flex: 1">
        <template #prepend>
          <el-icon>
            <User />
          </el-icon>
        </template>
      </el-input>
      <el-button type="success" @click="searchArticles" :disabled="loading" class="search-button"
        style="margin-left: 10px;">
        <el-icon>
          <Search />
        </el-icon>搜索
      </el-button>
      <el-button type="primary" @click="showAddDialog = true" style="margin-left: 10px;">
        <el-icon>
          <Plus />
        </el-icon> 添加文章
      </el-button>
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

    <div class="result-container" v-if="articles.length > 0">
      <el-table :data="articles" border style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="文章ID" width="70" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="author_name" label="作者" />
        <el-table-column prop="updated_time" label="更新时间" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? '已发布' : '已删除' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)">
              修改
            </el-button>
            <el-button type="danger" size="small" @click="deleteArticle(row.id)" :disabled="row.status === 1">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="!loading && articles.length === 0 && !searchError" class="no-data">
      <el-empty description="暂无数据" />
    </div>

    <!-- 添加文章对话框 -->
    <el-dialog v-model="showAddDialog" title="添加新文章" width="600px">
      <el-form :model="newArticle" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="newArticle.title" placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="newArticle.content" type="textarea" :rows="6" placeholder="请输入文章内容" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="createArticle">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑文章对话框 -->
    <el-dialog v-model="showEditDialog" title="修改文章" width="600px">
      <el-form :model="currentArticle" label-width="80px">
        <el-form-item label="文章ID">
          <el-input v-model.number="currentArticle.id" disabled />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="currentArticle.title" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="currentArticle.content" type="textarea" :rows="6" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="updateArticle">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Loading, Search, User } from '@element-plus/icons-vue'
import axios from 'axios'
import { baseURL } from '/src/config.js'

export default {
  components: {
    Plus,
    Loading,
    Search,
    User
  },
  setup() {
    const loading = ref(false)
    const searchKeyword = ref('')
    const articles = ref([])
    const searchError = ref('')
    const showAddDialog = ref(false)
    const showEditDialog = ref(false)
    const currentArticle = ref({
      id: null,
      title: '',
      content: '',
      status: 0
    })
    
    const newArticle = ref({
      title: '',
      content: ''
    })
    
    const searchArticles = async () => {
      articles.value = []
      searchError.value = ''
      loading.value = true
      
      try {
        if (!searchKeyword.value || !searchKeyword.value.trim()) {
          // 获取所有文章
          const response = await axios.get(
            `${baseURL}/api/articles/get`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
              }
            }
          )
          articles.value = response.data
        } else {
          // 获取单篇文章
          const articleId = searchKeyword.value.trim()
          const response = await axios.get(
            `${baseURL}/api/articles/get/${articleId}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
              }
            }
          )
          articles.value = [response.data]
        }
      } catch (error) {
        if (error.response?.status === 404) {
          searchError.value = '未查询到文章，请检查文章ID是否正确'
        } else {
          searchError.value = `查询失败: ${error.response?.data?.message || error.message}`
        }
      } finally {
        loading.value = false
      }
    }
    
    const createArticle = async () => {
      if (!newArticle.value.title || !newArticle.value.content) {
        ElMessage.warning('请填写标题和内容')
        return
      }
      
      try {
        const response = await axios.post(
          `${baseURL}/api/articles/create`,
          {
            title: newArticle.value.title,
            content: newArticle.value.content
          },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        )
        
        ElMessage.success('文章创建成功')
        showAddDialog.value = false
        newArticle.value = { title: '', content: '' }
        searchArticles() // 刷新列表
      } catch (error) {
        ElMessage.error(`创建失败: ${error.response?.data?.message || error.message}`)
      }
    }
    
    const openEditDialog = (article) => {
      currentArticle.value = { ...article }
      showEditDialog.value = true
    }
    
    const updateArticle = async () => {
      if (!currentArticle.value.title || !currentArticle.value.content) {
        ElMessage.warning('请填写标题和内容')
        return
      }
      
      try {
        await axios.put(
          `${baseURL}/api/articles/revise/${currentArticle.value.id}`,
          {
            title: currentArticle.value.title,
            content: currentArticle.value.content
          },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        )
        
        ElMessage.success('文章更新成功')
        showEditDialog.value = false
        searchArticles() // 刷新列表
      } catch (error) {
        ElMessage.error(`更新失败: ${error.response?.data?.message || error.message}`)
      }
    }
    
    const deleteArticle = (articleId) => {
      ElMessageBox.confirm('确定要删除这篇文章吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await axios.delete(
            `${baseURL}/api/articles/delete/${articleId}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
              }
            }
          )
          
          ElMessage.success('文章已删除')
          searchArticles() // 刷新列表
        } catch (error) {
          ElMessage.error(`删除失败: ${error.response?.data?.message || error.message}`)
        }
      }).catch(() => {})
    }
    
    return {
      loading,
      searchKeyword,
      articles,
      searchError,
      showAddDialog,
      showEditDialog,
      currentArticle,
      newArticle,
      searchArticles,
      createArticle,
      openEditDialog,
      updateArticle,
      deleteArticle
    }
  }
}
</script>

<style scoped>
.article-search {
  padding: 20px;
}

.search-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
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
</style>