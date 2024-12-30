<template>
    <div :class="['app', { 'dark': isDarkMode }]">
        <!-- Header Section -->
        <header class="header">
            <div class="header-content">
                <h1 class="title">FTP Client</h1>
                <p class="subtitle">Manage your FTP server connections</p>
                <button @click="toggleDarkMode" class="theme-toggle">
                    <Sun v-if="isDarkMode" class="icon" />
                    <Moon v-else class="icon" />
                </button>
            </div>
        </header>

        <main class="main-content">
            <!-- Connection Settings -->
            <section class="card connection-section">
                <h2 class="section-title">Connection Settings</h2>
                <div>
                    <div class="input-group">
                        <label for="host">Host:</label>
                        <div class="input-wrapper">
                            <input id="host" type="text" v-model="host" placeholder="Enter host address" class="input" />
                            <Server class="input-icon" />
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="port">Port:</label>
                        <div class="input-wrapper">
                            <input id="port" type="number" v-model="port" placeholder="Enter port number" class="input" />
                            <Hash class="input-icon" />
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="username">Username:</label>
                        <div class="input-wrapper">
                            <input id="username" type="text" v-model="username" placeholder="Enter username"
                                class="input" />
                            <User class="input-icon" />
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="password">Password:</label>
                        <div class="input-wrapper">
                            <input id="password" type="password" v-model="password" placeholder="Enter password"
                                class="input" />
                            <Lock class="input-icon" />
                        </div>
                    </div>
                </div>
            </section>

            <!-- Operations -->
            <section class="card operations-section">
                <h2 class="section-title">Operations</h2>
                <div class="button-grid">
                    <div class="tls-section">
                        <label class="switch-label">
                            <input 
                                type="checkbox" 
                                v-model="useTLS" 
                                class="switch-input"
                            >
                            <span class="switch-slider"></span>
                            使用 TLS
                        </label>
                    </div>
                    
                    <div v-if="useTLS" class="certificate-upload">
                        <label for="certificate" class="file-label" @click="handleCertificateUpload">
                            <Upload class="button-icon" />
                            选择证书
                        </label>
                        <span v-if="certificate" class="file-name">
                            {{ certificate.name }}
                        </span>

                        <label for="privateKey" class="file-label" @click="handlePrivateKeyUpload">
                            <Upload class="button-icon" />
                            选择私钥
                            
                        </label>
                        <span v-if="privateKey" class="file-name">
                            {{ privateKey.name }}
                        </span>

                        <label for="ca" class="file-label" @click="handleCAUpload">
                            <Upload class="button-icon" />
                            选择 CA 文件
                            
                        </label>
                        <span v-if="ca" class="file-name">
                            {{ ca.name }}
                        </span>
                    </div>
                    
                    <button 
                        v-if="!isLoggedIn"
                        @click="loginToServer" 
                        class="action-button"
                    >
                        <LogIn class="button-icon" /> Log In
                    </button>
                    
                    <button 
                        v-else
                        @click="logoutFromServer" 
                        class="action-button logout"
                    >
                        <LogOut class="button-icon" /> Log Out
                    </button>
                </div>
            </section>

            <!-- Status Information -->
            <section class="card status-section">
                <div class="status-header">
                    <h2 class="section-title">Status Information</h2>
                    <button @click="clearStatusLogs" class="clear-button" title="清空日志">
                        <Eraser class="clear-icon" />
                    </button>
                </div>
                <div class="status-container">
                    <transition-group name="fade" tag="ul" class="status-list">
                        <li v-for="(log, index) in statusLogs" :key="index" class="status-item">
                            {{ log }}
                        </li>
                    </transition-group>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Sun, Moon, Server, Hash, User, Lock, Upload, LogIn, LogOut, Eraser } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useFtpStore } from '../stores/ftpStore'
const { ipcRenderer, remote } = window.require('electron');
const router = useRouter()
const ftpStore = useFtpStore()

const host = ref('')
const port = ref('')
const username = ref('')
const password = ref('')
const useTLS = ref(false)
const certificate = ref(null)
const key = ref(null)
const ca = ref(null)
const isLoggedIn = ref(false)

// 使用 store 中的状态
const isDarkMode = computed(() => ftpStore.isDarkMode)
const statusLogs = computed(() => ftpStore.statusLogs)

const toggleDarkMode = () => {
    ftpStore.toggleDarkMode()
}

const addStatusLog = (message) => {
    ftpStore.addStatusLog(message)
}

const clearStatusLogs = () => {
    ftpStore.clearStatusLogs()
}

const socket_login = ref(null)

const loginToServer = () => {
    // 检查必填字段
    const missingFields = []
    if (!host.value) missingFields.push('主机地址')
    if (!port.value) missingFields.push('端口')
    if (!username.value) missingFields.push('用户名')
    if (!password.value) missingFields.push('密码')

    if (missingFields.length > 0) {
        addStatusLog(`登录失败: ${missingFields.join(', ')}不能为空！`)
        return
    }

    // 建立 WebSocket 连接
    socket_login.value = new WebSocket(`ws://127.0.0.1:9002`)
    ftpStore.setSocket(socket_login.value)

    socket_login.value.onopen = () => {
        console.log("WebSocket connected.")
        
        const connectPayload = {
            cmd: "connect",
            host: host.value,
            port: Number(port.value),
            useTLS: useTLS.value,
        }
        if (useTLS.value) {
        if (ca && certificate && key) {
            connectPayload.ca_file = ca.value;        // CA 文件名
            connectPayload.cert_file = certificate.value; // 证书文件名
            connectPayload.key_file = key.value;   // 私钥文件名
        } else {
            console.error("TLS 需要提供 CA 文件、证书文件和私钥文件！");
            addStatusLog(`缺少必要文件`)
        }
    }
        socket_login.value.send(JSON.stringify(connectPayload))
        addStatusLog(`发送连接请求...`)
    }

    socket_login.value.onmessage = (event) => {
        const response = JSON.parse(event.data)
        if (response.status === "success") {
            addStatusLog(`已连接到 ${host.value}:${port.value}`)
            addStatusLog("连接成功，发送登录请求...")
            
            const loginPayload = {
                cmd: "login",
                username: username.value,
                password: password.value,
            }
            socket_login.value.send(JSON.stringify(loginPayload))
            
            socket_login.value.onmessage = (event) => {
                const response = JSON.parse(event.data)
                if (response.status === "success") {
                    // 保存连接信息到 store
                    ftpStore.setConnectionInfo({
                        host: host.value,
                        port: port.value,
                        username: username.value,
                        isConnected: true
                    })
                    
                    // addStatusLog(`用户 ${username.value} 登录成功！`)
                    isLoggedIn.value = true

                    // 跳转到文件管理器页面
                    router.push("/file-manager")
                } else {
                    addStatusLog(`登录失败: ${response.error}`)
                }
            }
        } else {
            addStatusLog(`操作失败: ${response.error}`)
        }
    }

    socket_login.value.onerror = (error) => {
        addStatusLog(`WebSocket错误: ${error.message}`)
    }

    socket_login.value.onclose = () => {
        addStatusLog("WebSocket连接已关闭")
        isLoggedIn.value = false
    }
}



const handleCertificateUpload = async (event) => {
    try {
        // Open the file dialog from the main process
        const result = await ipcRenderer.invoke('open-file-dialog');
        if (result.success) {
            certificate.value = result.filePath; // Store the file path
            console.log("证书路径：",certificate.value);
            addStatusLog(`已选择证书: ${result.fileName}`);
        } else {
            addStatusLog('未选择证书');
        }
    } catch (err) {
        addStatusLog(`打开证书失败: ${err.message}`);
    }
};

const handlePrivateKeyUpload = async (event) => {
    try {
        // Open the file dialog from the main process
        const result = await ipcRenderer.invoke('open-key-dialog');
        if (result.success) {
            key.value = result.filePath; // Store the file path
            console.log("私钥路径：",key.value);
            addStatusLog(`已选择私钥: ${result.fileName}`);
        } else {
            addStatusLog('未选择私钥');
        }
    } catch (err) {
        addStatusLog(`打开私钥失败: ${err.message}`);
    }
};

const handleCAUpload = async (event) => {
    try {
        // Open the file dialog from the main process
        const result = await ipcRenderer.invoke('open-ca-dialog');
        if (result.success) {
            ca.value = result.filePath; // Store the file path
            console.log("CA路径：",ca.value);
            addStatusLog(`已选择CA: ${result.fileName}`);
        } else {
            addStatusLog('未选择CA');
        }
    } catch (err) {
        addStatusLog(`打开CA失败: ${err.message}`);
    }
};
const logoutFromServer = () => {
    isLoggedIn.value = false
    addStatusLog(`正在断开与 ${host.value}:${port.value} 的连接...`);
    setTimeout(() => {
        addStatusLog('连接已断开，登出成功');
        // 可选：清空敏感信息
        password.value = '';
    }, 1000)
}
</script>

<style scoped>
/* 输入框相关样式 */
.connection-section {
    display: flex;
    flex-direction: column;
    height: 100%;  /* 确保section占满高度 */
}

/* 添加一个包装器来控制输入框组的布局 */
.connection-section > .section-title + div {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;  /* 等间距分布 */
    height: calc(100% - 3rem);  /* 减去标题的高度 */
    padding: 1rem 0;
}

.input-group {
    width: 90%;
    margin: 0 auto;  /* 水平居中 */
}

/* 移除多余的margin设置 */
.input-group:first-of-type,
.input-group:last-of-type {
    margin: 0 auto;
}

.input-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-color);
    font-weight: 500;
}

.input-wrapper {
    position: relative;
}

.input {
    width: 100%;
    padding: 0.75rem 1rem;
    padding-left: 2.5rem;
    border: 2px solid var(--border-color);
    border-radius: 1rem;
    background-color: var(--bg-color);
    color: var(--text-color);
    font-size: 1rem;
    transition: all 0.3s ease;
}

.input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px rgb(37 99 235 / 0.1);
}

.input-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    width: 1.25rem;
    height: 1.25rem;
}

/* 按钮网格布局 */
.button-grid {
    display: grid;
    grid-template-rows: repeat(auto-fit, minmax(50px, 1fr));
    align-items: center;
    gap: 0.5rem;
}

.button-grid button {
    width: 90%;
    margin: 0 auto;
}

/* 操作按钮样式 */
.action-button {
    background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 1rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    letter-spacing: 0.025em;
}

.action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px -4px rgb(37 99 235 / 0.25);
}

.action-button:active {
    animation: pulse 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.button-icon {
    margin-right: 0.5rem;
    width: 1.25rem;
    height: 1.25rem;
}

/* TLS 开关样式 */
.tls-section {
    margin-bottom: 1rem;
    width: 90%;
    margin: 0 auto;
}

.switch-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    color: var(--text-color);
}

.switch-input {
    display: none;
}

.switch-slider {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 26px;
    background-color: var(--text-secondary);
    border-radius: 26px;
    margin-right: 12px;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-slider:before {
    content: "";
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: white;
    top: 2px;
    left: 2px;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-md);
}

.switch-input:checked + .switch-slider {
    background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
}

.switch-input:checked + .switch-slider:before {
    transform: translateX(24px);
}

/* 证书上传样式 */
.certificate-upload {
    width: 90%;
    margin: 0.5rem auto;
}

.file-label {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem;
    background-color: var(--primary-color);
    color: white;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.file-label:hover {
    background-color: var(--button-hover);
}

.file-input {
    display: none;
}

.file-name {
    display: block;
    margin-top: 0.5rem;
    text-align: center;
    color: var(--text-color);
    font-size: 0.9rem;
}

/* 登出按钮样式 */
.logout {
    background-color: #dc3545;
}

.logout:hover {
    background-color: #c82333;
}

/* 动画 */
@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
    }
}

/* 深色模式特定样式 */
.app.dark .input {
    background-color: #111827;
    border-color: #374151;
}

.app.dark .input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.app.dark .input-icon {
    color: #9ca3af;
}

/* 响应式布局 */
@media (max-width: 640px) {
    .input-group {
        width: 100%;
    }
}
</style>