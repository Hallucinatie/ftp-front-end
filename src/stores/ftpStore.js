import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFtpStore = defineStore('ftp', () => {
    // WebSocket连接
    const socket = ref(null)

    // 连接信息
    const connectionInfo = ref({
        host: '',
        port: '',
        username: '',
        isConnected: false,
        isAuthenticated: false
    })

    //登陆状态
    const isLoggedIn = ref(false)
    
    // 主题设置
    const isDarkMode = ref(false)

    // 状态日志
    const statusLogs = ref([])

    // 方法
    const setSocket = (newSocket) => {
        socket.value = newSocket
    }

    const setConnectionInfo = (info) => {
        connectionInfo.value = {
            ...connectionInfo.value,
            ...info
        }
        // 如果设置了用户名，同时设置认证状态
        if (info.username) {
            connectionInfo.value.isAuthenticated = true
        }
    }

    const toggleDarkMode = () => {
        isDarkMode.value = !isDarkMode.value
    }

    const addStatusLog = (message) => {
        // 如果已经认证，忽略所有登录成功消息
        if (connectionInfo.value.isAuthenticated && message.includes('登录成功')) {
            return
        }
        // 如果是首次登录成功消息，设置认证状态
        if (!connectionInfo.value.isAuthenticated && message.includes('登录成功')) {
            connectionInfo.value.isAuthenticated = true
        }
        statusLogs.value = [message, ...statusLogs.value.slice(0, 8)]
    }

    const clearStatusLogs = () => {
        statusLogs.value = []
    }

    const resetConnection = () => {
        if (socket.value) {
            socket.value.close()
            socket.value = null
        }
        connectionInfo.value = {
            host: '',
            port: '',
            username: '',
            isConnected: false,
            isAuthenticated: false
        }
    }

    return {
        socket,
        connectionInfo,
        isDarkMode,
        statusLogs,
        setSocket,
        setConnectionInfo,
        toggleDarkMode,
        addStatusLog,
        clearStatusLogs,
        resetConnection
    }
}) 