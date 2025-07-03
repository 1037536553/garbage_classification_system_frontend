// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import MainLayout from '../views/MainLayout.vue'
import UserPage from '../views/user/UserPage.vue'
import ArticlePage from '../views/article/ArticlePage.vue'
import RecognitionHistoryPage from '../views/history/RecognitionHistoryPage.vue'
import RewardHistoryPage from '../views/reward/RewardHistoryPage.vue'

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
  
  if (to.path !== '/' && !isLoggedIn) {
    next('/');
  } else if (to.path === '/' && isLoggedIn) {
    next('/user');
  } else {
    next();
  }
})

export default router