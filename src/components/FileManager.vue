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
                <h2 class="section-title">
                    Local Files
                    <div class="button-container">
                        <button @click="uploadFiles" class="action-button" title="上传选中文件">
                            <Upload class="button-icon" />
                        </button>
                    </div>
                </h2>
                <div class="file-explorer">
                    <div class="path-navigator">
                        <button class="nav-button" @click="goToParentDirectory" title="返回上级目录">
                            <ArrowLeft class="button-icon" />
                        </button>
                        <input type="text" class="path-input" v-model="localPath" readonly />
                        <button @click="openDirectory" class="nav-button" title="选择目录">
                            <Folder class="button-icon" />
                        </button>
                    </div>
                    <div class="file-list">
                        <div v-for="file in localFiles" 
                             :key="file.name" 
                             class="file-item"
                             :data-selected="selectedLocalFiles.has(file.name)"
                             @click="handleFileClick(file)"
                             @contextmenu.prevent="showContextMenu(file)">
                            <Folder v-if="file.isDirectory" class="file-icon" />
                            <File v-else class="file-icon" />
                            <span class="file-name">{{ file.name }}</span>
                            <span class="file-size">{{ formatFileSize(file.size) }}</span>
                            <input type="checkbox" 
                                   class="file-select" 
                                   :checked="selectedLocalFiles.has(file.name)"
                                   @click.stop="toggleFileSelection('local', file.name)" />
                        </div>
                    </div>
                </div>
            </section>

            <!-- Remote Files Section -->
            <section class="card remote-section">
                <h2 class="section-title">
                    Remote Files
                    <div class="button-container">
                        <button @click="refreshRemoteFiles" class="action-button" title="刷新">
                            <RefreshCw class="button-icon" />
                        </button>
                        <button @click="createNewFolder" class="action-button" title="新建文件夹">
                            <FolderPlus class="button-icon" />
                        </button>
                        <button @click="deleteSelectedFiles" class="action-button" title="删除选中文件">
                            <Trash2 class="button-icon" />
                        </button>
                        <button @click="downloadFiles" class="action-button" title="下载选中文件">
                            <Download class="button-icon" />
                        </button>
                    </div>
                </h2>
                <div class="file-explorer">
                    <div class="path-navigator">
                        <button class="nav-button">
                            <ArrowLeft class="button-icon" />
                        </button>
                        <input type="text" class="path-input" v-model="remotePath" readonly />
                    </div>
                    <div class="file-list">
                        <div v-for="file in remoteFiles" 
                             :key="file.name" 
                             class="file-item"
                             :data-selected="selectedRemoteFiles.has(file.name)"
                             @click="toggleFileSelection('remote', file.name)">
                            <Folder v-if="file.isDirectory" class="file-icon" />
                            <File v-else class="file-icon" />
                            <span class="file-name">{{ file.name }}</span>
                            <span class="file-size">{{ formatFileSize(file.size) }}</span>
                            <input type="checkbox" 
                                   class="file-select" 
                                   :checked="selectedRemoteFiles.has(file.name)"
                                   @click.stop />
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
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { Sun, Moon, Folder, File, ArrowLeft, Eraser, Upload, Download, FolderPlus, Trash2, RefreshCw } from 'lucide-vue-next'
const { ipcRenderer, remote } = window.require('electron')
const path = window.require('path')

const isDarkMode = ref(false)
const statusLogs = ref([])
const localPath = ref('C:/')
const remotePath = ref('/')
const selectedLocalFiles = ref(new Set())
const selectedRemoteFiles = ref(new Set())
const directoryHistory = ref([])

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
        const result = await ipcRenderer.invoke('open-directory')
        if (result.success) {
            localPath.value = result.path
            localFiles.value = result.files
            addStatusLog(`成功打开文件夹: ${result.path}`)
        }
    } catch (err) {
        addStatusLog(`打开文件夹失败: ${err.message}`)
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

const uploadFiles = async () => {
    if (selectedLocalFiles.value.size === 0) {
        addStatusLog('请选择要上传的文件')
        return
    }

    const selectedFilesList = Array.from(selectedLocalFiles.value)
    addStatusLog(`准备上传文件: ${selectedFilesList.join(', ')}`)

    try {
        // 这里添加实际的上传逻辑
        for (const fileName of selectedFilesList) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟上传延迟
            addStatusLog(`文件 ${fileName} 上传成功`)
        }
        
        // 清空选择 - 使用新的空 Set
        selectedLocalFiles.value = new Set()
    } catch (error) {
        addStatusLog(`上传失败: ${error.message}`)
    }
}

const downloadFiles = async () => {
    if (selectedRemoteFiles.value.size === 0) {
        addStatusLog('请选择要下载的文件')
        return
    }

    const selectedFilesList = Array.from(selectedRemoteFiles.value)
    addStatusLog(`准备下载文件: ${selectedFilesList.join(', ')}`)

    try {
        // 这里添加实际的下载逻辑
        for (const fileName of selectedFilesList) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟下载延迟
            addStatusLog(`文件 ${fileName} 下载成功`)
        }
        
        // 清空选择 - 使用新的空 Set
        selectedRemoteFiles.value = new Set()
    } catch (error) {
        addStatusLog(`下载失败: ${error.message}`)
    }
}

const toggleFileSelection = (fileType, fileName) => {
    const selectedFiles = fileType === 'local' ? selectedLocalFiles : selectedRemoteFiles
    // 创建新的 Set 来触发响应式更新
    if (selectedFiles.value.has(fileName)) {
        const newSet = new Set(selectedFiles.value)
        newSet.delete(fileName)
        selectedFiles.value = newSet
    } else {
        const newSet = new Set(selectedFiles.value)
        newSet.add(fileName)
        selectedFiles.value = newSet
    }
}

const refreshRemoteFiles = async () => {
    try {
        addStatusLog('正在刷新远程文件列表...')
        // 这里添加实际的刷新逻辑
        await new Promise(resolve => setTimeout(resolve, 500)) // 模拟刷新延迟
        addStatusLog('刷新完成')
    } catch (error) {
        addStatusLog(`刷新失败: ${error.message}`)
    }
}

const createNewFolder = async () => {
    try {
        const folderName = prompt('请输入文件夹名称:')
        if (!folderName) return
        
        addStatusLog(`正在创建文件夹: ${folderName}`)
        // 这里添加实际的创建文件夹逻辑
        await new Promise(resolve => setTimeout(resolve, 500)) // 模拟创建延迟
        addStatusLog(`文件夹 ${folderName} 创建成功`)
    } catch (error) {
        addStatusLog(`创建文件夹失败: ${error.message}`)
    }
}

const deleteSelectedFiles = async () => {
    if (selectedRemoteFiles.value.size === 0) {
        addStatusLog('请选择要删除的文件')
        return
    }

    const selectedFilesList = Array.from(selectedRemoteFiles.value)
    if (!confirm(`确定要删除这些文件吗?\n${selectedFilesList.join('\n')}`)) {
        return
    }

    try {
        addStatusLog(`正在删除文件: ${selectedFilesList.join(', ')}`)
        // 这里添加实际的删除逻辑
        await new Promise(resolve => setTimeout(resolve, 500)) // 模拟删除延迟
        addStatusLog('删除成功')
        selectedRemoteFiles.value = new Set()
    } catch (error) {
        addStatusLog(`删除失败: ${error.message}`)
    }
}

const goToParentDirectory = async () => {
    try {
        const parentPath = path.dirname(localPath.value)
        if (parentPath === localPath.value) {
            addStatusLog('已经是根目录')
            return
        }
        await navigateToDirectory(parentPath)
    } catch (err) {
        addStatusLog(`返回上级目录失败: ${err.message}`)
    }
}

const handleFileClick = async (file) => {
    if (file.isDirectory) {
        const newPath = path.join(localPath.value, file.name)
        await navigateToDirectory(newPath)
    }
}

const navigateToDirectory = async (targetPath) => {
    try {
        const result = await ipcRenderer.invoke('read-directory', targetPath)
        if (result.success) {
            localPath.value = result.path
            localFiles.value = result.files
            addStatusLog(`已进入目录: ${result.path}`)
        }
    } catch (err) {
        addStatusLog(`打开目录失败: ${err.message}`)
    }
}

const showContextMenu = (file) => {
    const menu = new remote.Menu()
    
    if (file.isDirectory) {
        menu.append(new remote.MenuItem({
            label: '打开',
            click: () => handleFileClick(file)
        }))
    }
    
    menu.append(new remote.MenuItem({
        label: '复制路径',
        click: () => {
            const fullPath = path.join(localPath.value, file.name)
            remote.clipboard.writeText(fullPath)
            addStatusLog('路径已复制到剪贴板')
        }
    }))

    menu.popup()
}

// 添加文件大小格式化函数
const formatFileSize = (bytes) => {
    if (bytes === '-') return '-'
    if (bytes === 0) return '0 B'
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
}

</script>

<style scoped>
/* 继承 Login.vue 的基础样式 */
@import '../style.css';

/* 文件管理器特定样式 */
.file-explorer {
    height: calc(100% - 50px);
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 1rem;
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
    user-select: none;
    position: relative;
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
    display: flex;
    flex-direction: column;
    position: relative;
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

.button-container {
    display: flex;
    gap: 0.5rem;
    height: 32px;
    margin-left: auto;
}

.action-button {
    padding: 0.5rem;
    font-size: 0.85rem;
    height: 32px;
    width: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button-icon {
    width: 1rem;
    height: 1rem;
}

.file-select {
    cursor: pointer;
    margin-left: 0.5rem;
}

.file-item.selected {
    background-color: var(--primary-color-light);
}

.section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5 rem;
    margin: 0;
}

/* 添加选中状态的样式 */
.file-item[data-selected="true"] {
    background-color: rgba(var(--primary-color-rgb), 0.1);
}

.file-item[data-is-directory="true"] {
    cursor: pointer;
}

.file-item[data-is-directory="true"]:hover {
    background-color: var(--border-color);
}

.file-item[data-is-directory="true"] .file-icon {
    color: var(--primary-color);
}
</style>