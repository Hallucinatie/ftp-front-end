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
            <!-- Local Files Section -->
            <section class="card local-section">
                <h2 class="section-title">Local Files</h2>
                <div class="file-explorer">
                    <div class="path-navigator">
                        <button class="nav-button">
                            <ArrowLeft class="button-icon" />
                        </button>
                        <input type="text" class="path-input" v-model="localPath" readonly />
                        <button @click="openDirectory" class="nav-button">
                            <Folder class="button-icon" />
                        </button>
                    </div>
                    <div class="file-list">
                        <div v-for="file in localFiles" :key="file.name" class="file-item">
                            <Folder v-if="file.isDirectory" class="file-icon" />
                            <File v-else class="file-icon" />
                            <span class="file-name">{{ file.name }}</span>
                            <span class="file-size">{{ file.size }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Remote Files Section -->
            <section class="card remote-section">
                <h2 class="section-title">Remote Files</h2>
                <div class="file-explorer">
                    <div class="path-navigator">
                        <button class="nav-button">
                            <ArrowLeft class="button-icon" />
                        </button>
                        <input type="text" class="path-input" v-model="remotePath" readonly />
                    </div>
                    <div class="file-list">
                        <div v-for="file in remoteFiles" :key="file.name" class="file-item">
                            <Folder v-if="file.isDirectory" class="file-icon" />
                            <File v-else class="file-icon" />
                            <span class="file-name">{{ file.name }}</span>
                            <span class="file-size">{{ file.size }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Status Information -->
            <section class="card status-section">
                <div class="status-header">
                    <h2 class="section-title">Status Information</h2>
                    <button @click="clearStatusLogs" class="clear-button">
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

        <input 
            type="file" 
            webkitdirectory 
            @change="handleFileInput" 
            style="display: none" 
            ref="fileInput"
        />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { Sun, Moon, Folder, File, ArrowLeft, Eraser } from 'lucide-vue-next'

const isDarkMode = ref(false)
const statusLogs = ref([])
const localPath = ref('C:/')
const remotePath = ref('/')

// 模拟数据
const localFiles = ref([
    { name: 'Documents', isDirectory: true, size: '-' },
    { name: 'Pictures', isDirectory: true, size: '-' },
    { name: 'test.txt', isDirectory: false, size: '1.2 MB' },
])

const remoteFiles = ref([
    { name: 'public_html', isDirectory: true, size: '-' },
    { name: 'logs', isDirectory: true, size: '-' },
    { name: 'index.php', isDirectory: false, size: '2.4 KB' },
])

const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
}

const addStatusLog = (message) => {
    statusLogs.value = [message, ...statusLogs.value.slice(0, 8)]
}

const clearStatusLogs = () => {
    statusLogs.value = []
}

const openDirectory = async () => {
    try {
        // 请求用户选择文件夹
        const dirHandle = await window.showDirectoryPicker();
        const files = [];
        
        // 遍历文件夹内容
        for await (const entry of dirHandle.values()) {
            const file = {
                name: entry.name,
                isDirectory: entry.kind === 'directory',
                size: entry.kind === 'file' ? await (await entry.getFile()).size : '-'
            };
            files.push(file);
        }
        
        localFiles.value = files;
        addStatusLog(`成功打开文件夹: ${dirHandle.name}`);
    } catch (err) {
        addStatusLog(`打开文件夹失败: ${err.message}`);
    }
}

const handleFileInput = (event) => {
    const files = Array.from(event.target.files).map(file => ({
        name: file.name,
        isDirectory: false,
        size: file.size
    }));
    localFiles.value = files;
}
</script>

<style scoped>
/* 继承 Login.vue 的基础样式 */
@import '../style.css';

/* 文件管理器特定样式 */
.file-explorer {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.path-navigator {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: var(--bg-color);
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
}

.nav-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    color: var(--text-color);
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-button:hover {
    background-color: var(--border-color);
}

.path-input {
    flex: 1;
    border: none;
    background: none;
    color: var(--text-color);
    font-size: 0.9rem;
    padding: 0 0.5rem;
}

.file-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    background-color: var(--bg-color);
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
    padding: 0.5rem;
}

.file-item {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.file-item:hover {
    background-color: var(--border-color);
}

.file-icon {
    width: 1.25rem;
    height: 1.25rem;
    margin-right: 0.5rem;
    color: var(--text-color);
}

.file-name {
    flex: 1;
    color: var(--text-color);
}

.file-size {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.local-section,
.remote-section {
    height: 100%;
    overflow: hidden;
}

.status-section {
    grid-column: 1 / -1;
    height: 100%;
}

/* 深色模式适配 */
.app.dark .file-list {
    background-color: var(--card-bg);
}

.app.dark .path-navigator {
    background-color: var(--card-bg);
}

.app.dark .file-item:hover {
    background-color: var(--border-color);
}
</style> 