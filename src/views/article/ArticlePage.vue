<!-- src/views/function1/Function1Page.vue -->
<template>
  <div class="article-page">
    <ArticleSearch />
  </div>
</template>

<script>
import ArticleSearch from '/src/components/ArticleSearch.vue'

export default {

  components: {
    ArticleSearch
  }
}
</script>

<style scoped>
.article-page {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>