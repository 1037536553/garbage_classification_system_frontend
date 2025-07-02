<template>
  <div class="entry-search">
    <el-input 
      v-model="searchKeyword"
      placeholder="请输入垃圾名称、ID或类别进行搜索"
      clearable
      @input="searchEntries"
    >
      <template #append>
        <el-button 
          type="success" 
          @click="searchEntries"
          class='search-button'
        >
        搜索
        </el-button>
      </template>
    </el-input>
    
    <div class="table-header">
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon> 添加新词条
      </el-button>
    </div>
    
    <el-table :data="filteredEntries" border style="width: 100%; margin-top: 10px">
      <el-table-column prop="garbage_id" label="垃圾ID" width="120" sortable />
      <el-table-column prop="garbage_name" label="垃圾名称" width="200" />
      <el-table-column prop="category_id" label="垃圾类别" width="150">
        <template #default="{ row }">
          <el-tag :type="getCategoryTagType(row.category_id)">
            {{ getCategoryName(row.category_id) }}
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
            更改
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 添加弹窗 -->
    <el-dialog v-model="showAddDialog" title="添加新词条" width="500px">
      <el-form :model="newEntry" label-width="120px">
        <el-form-item label="垃圾ID">
          <el-input v-model.number="newEntry.garbage_id" type="number" />
        </el-form-item>
        <el-form-item label="垃圾名称">
          <el-input v-model="newEntry.garbage_name" />
        </el-form-item>
        <el-form-item label="垃圾类别">
          <el-select v-model.number="newEntry.category_id" placeholder="请选择">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="addEntry">确认</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEditDialog" title="更改词条" width="500px">
      <el-form :model="currentEditItem" label-width="120px">
        <el-form-item label="垃圾ID">
          <el-input v-model.number="currentEditItem.garbage_id" disabled />
        </el-form-item>
        <el-form-item label="垃圾名称">
          <el-input v-model="currentEditItem.garbage_name" />
        </el-form-item>
        <el-form-item label="垃圾类别">
          <el-select v-model.number="currentEditItem.category_id" placeholder="请选择">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="updateEntry">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, markRaw } from 'vue'
import { Plus } from '@element-plus/icons-vue'

// 垃圾类别映射
const categories = [
  { id: 1, name: '可回收垃圾' },
  { id: 2, name: '有害垃圾' },
  { id: 3, name: '厨余垃圾' },
  { id: 4, name: '其他垃圾' }
]

// 模拟垃圾数据库
const mockEntries = [
  { garbage_id: 101, garbage_name: '纸箱', category_id: 1 },
  { garbage_id: 102, garbage_name: '塑料瓶', category_id: 1 },
  { garbage_id: 103, garbage_name: '玻璃杯', category_id: 1 },
  { garbage_id: 201, garbage_name: '电池', category_id: 2 },
  { garbage_id: 202, garbage_name: '过期药品', category_id: 2 },
  { garbage_id: 301, garbage_name: '剩饭剩菜', category_id: 3 },
  { garbage_id: 302, garbage_name: '果皮', category_id: 3 },
  { garbage_id: 401, garbage_name: '陶瓷碎片', category_id: 4 },
  { garbage_id: 402, garbage_name: '污染纸张', category_id: 4 },
  { garbage_id: 403, garbage_name: '一次性餐具', category_id: 4 }
]

export default {
  components: {
    Plus: markRaw(Plus)
  },
  setup() {
    const searchKeyword = ref('')
    const entries = ref([...mockEntries])
    const showAddDialog = ref(false)
    const showEditDialog = ref(false)
    const currentEditItem = ref(null)
    
    const newEntry = ref({
      garbage_id: null,
      garbage_name: '',
      category_id: null
    })
    
    // 垃圾类别名称映射
    const getCategoryName = (categoryId) => {
      const category = categories.find(c => c.id === categoryId)
      return category ? category.name : '未知类别'
    }
    
    // 垃圾类别标签样式
    const getCategoryTagType = (categoryId) => {
      switch (categoryId) {
        case 1: return 'success'
        case 2: return 'danger'
        case 3: return 'warning'
        case 4: return 'info'
        default: return ''
      }
    }
    
    // 搜索逻辑
    const filteredEntries = computed(() => {
      if (!searchKeyword.value.trim()) {
        return entries.value
      }
      
      const keywords = searchKeyword.value.trim().toLowerCase().split(/\s+/)
      
      // 处理AND逻辑
      if (keywords.includes('and')) {
        const andKeywords = keywords.filter(k => k !== 'and')
        if (andKeywords.length < 2) return []
        
        return entries.value.filter(entry => {
          const entryStr = `${entry.garbage_id} ${entry.garbage_name} ${getCategoryName(entry.category_id)}`.toLowerCase()
          return andKeywords.every(k => entryStr.includes(k))
        })
      }
      
      // 处理OR逻辑（默认）
      return entries.value.filter(entry => {
        const entryStr = `${entry.garbage_id} ${entry.garbage_name} ${getCategoryName(entry.category_id)}`.toLowerCase()
        return keywords.some(k => entryStr.includes(k))
      })
    })
    
    const searchEntries = () => {
      // 搜索逻辑已在computed中处理
    }
    
    // 打开编辑弹窗
    const openEditDialog = (item) => {
      currentEditItem.value = { ...item }
      showEditDialog.value = true
    }
    
    // 添加新词条
    const addEntry = () => {
        if (!newEntry.value.garbage_id || isNaN(newEntry.value.garbage_id)) {
            ElMessage.error('请输入有效的垃圾ID');
            return;
        }
        
        if (!newEntry.value.garbage_name.trim()) {
            ElMessage.error('请输入垃圾名称');
            return;
        }
        
        if (!newEntry.value.category_id) {
            ElMessage.error('请选择垃圾类别');
            return;
        }
      if (!newEntry.value.garbage_id || !newEntry.value.garbage_name || !newEntry.value.category_id) {
        return
      }
      
      entries.value.push({ ...newEntry.value })
      showAddDialog.value = false
      
      // 重置表单
      newEntry.value = {
        garbage_id: null,
        garbage_name: '',
        category_id: null
      }
    }
    
    // 更新词条
    const updateEntry = () => {
      const index = entries.value.findIndex(
        e => e.garbage_id === currentEditItem.value.garbage_id
      )
      
      if (index !== -1) {
        entries.value[index] = { ...currentEditItem.value }
      }
      
      showEditDialog.value = false
    }
    
    return {
      searchKeyword,
      entries,
      filteredEntries,
      categories,
      newEntry,
      currentEditItem,
      showAddDialog,
      showEditDialog,
      getCategoryName,
      getCategoryTagType,
      searchEntries,
      openEditDialog,
      addEntry,
      updateEntry
    }
  }
}
</script>

<style scoped>
.entry-search {
  padding: 20px;
}

.table-header {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

/* 添加自定义按钮样式 */
.search-button {
  color: black !important;
}

/* 添加悬停效果 */
.search-button:hover {
  background-color: #5daf34 !important;
  border-color: #5daf34 !important;
  color: white !important;
}
</style>