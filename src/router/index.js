// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import MainLayout from '../views/MainLayout.vue'
import UserPage from '../views/user/UserPage.vue'
import ArticlePage from '../views/article/ArticlePage.vue'
import RecognitionHistoryPage from '../views/history/RecognitionHistoryPage.vue'
import RewardHistoryPage from '../views/reward/RewardHistoryPage.vue'
// 定义路由
const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/main',
    component: MainLayout,
    redirect: '/user',
    children: [
      {
        path: '/user',
        name: 'User',
        component: UserPage
      },
      {
        path: '/article',
        name: 'Article',
        component: ArticlePage
      },
      {
        path: '/history',
        name: 'History',
        component: RecognitionHistoryPage
      },
      {
        path: '/reward',
        name: 'Reward',
        component: RewardHistoryPage
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('adminToken') !== null;
  
  // 如果访问的路径不是登录页且未登录，则重定向到登录页
  if (to.path !== '/' && !isLoggedIn) {
    next('/');
  // 如果访问的是登录页且已登录，则重定向到用户查询页面（默认）
  } else if (to.path === '/' && isLoggedIn) {
    next('/user');
  } else {
    next();
  }
})

export default router