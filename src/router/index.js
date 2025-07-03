// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import MainLayout from '../views/MainLayout.vue'
import UserPage from '../views/user/UserPage.vue'
import Function1Page from '../views/function1/Function1Page.vue'
import Function2Page from '../views/function2/Function2Page.vue'

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
        path: '/function1',
        name: 'Function1',
        component: Function1Page
      },
      {
        path: '/function2',
        name: 'Function2',
        component: Function2Page
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