import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import FileManager from '../components/FileManager.vue'

const routes = [
    {
        path: '/',
        name: 'Login',
        component: Login
    },
    {
        path: '/file-manager',
        name: 'FileManager',
        component: FileManager
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router 