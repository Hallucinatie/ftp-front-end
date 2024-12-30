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
                <div class="transfer-mode-toggle">
                    <span class="mode-label">{{ transferMode ? '主动模式' : '被动模式' }}</span>
                    <div 
                        class="switch" 
                        :class="{ active: transferMode }" 
                        @click="toggleTransferMode"
                    >
                        <div class="switch-handle"></div>
                    </div>
                </div>
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
                        <button class="nav-button" @click="goToParentRemoteDirectory" title="返回上级目录">
                            <ArrowLeft class="button-icon" />
                        </button>
                        <input type="text" class="path-input" v-model="remotePath" readonly />
                    </div>
                    <div class="file-list">
                        <div v-for="file in remoteFiles" 
                             :key="file.name" 
                             class="file-item"
                             :data-selected="selectedRemoteFiles.has(file.name)"
                             @click="handleRemoteFileClick(file)">
                            <Folder v-if="file.isDirectory" class="file-icon" />
                            <Link v-else-if="file.isSymlink" class="file-icon" />
                            <File v-else class="file-icon" />
                            
                            <span class="file-name">
                                {{ file.name }}
                                <span v-if="file.isSymlink" class="link-target">
                                    -> {{ file.linkTarget }}
                                </span>
                            </span>
                            
                            <span class="file-size">{{ formatFileSize(file.size) }}</span>
                            
                            <input type="checkbox" 
                                   class="file-select" 
                                   :checked="selectedRemoteFiles.has(file.name)"
                                   @click.stop="toggleFileSelection('remote', file.name)" />
                        </div>
                    </div>
                    <div class="path-input-container">
                        <label for="downloadPathInput">下载路径:  </label>
                        <input
                            type="text"
                            id="downloadPathInput"
                            placeholder="输入本地下载路径"
                            style="width: 300px;" 
                        />
                    </div>
                    <div class="path-input-container">
                        <label for="mkdirNameInput">新建文件夹: </label>
                        <input
                            type="text"
                            id="mkdirNameInput"
                            placeholder="输入新建文件夹名称"
                            style="width: 300px;" 
                        />
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
import { ref, computed, onMounted, watch } from 'vue'
import { Sun, Moon, Folder, File, Link, ArrowLeft, Eraser, Upload, Download, FolderPlus, Trash2, RefreshCw } from 'lucide-vue-next'
import { useFtpStore } from '../stores/ftpStore'
import { useRouter } from 'vue-router'
const { ipcRenderer, remote } = window.require('electron')
const path = window.require('path')

const ftpStore = useFtpStore()
const router = useRouter()

// 使用 store 中的状态
const isDarkMode = computed(() => ftpStore.isDarkMode)
const statusLogs = computed(() => ftpStore.statusLogs)
const socket = computed(() => ftpStore.socket)
const connectionInfo = computed(() => ftpStore.connectionInfo)

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
    ftpStore.toggleDarkMode()
}

const addStatusLog = (message) => {
    // 忽略登录成功的消息
    if (message.includes('anonymous')) {
        return
    }
    ftpStore.addStatusLog(message)
}

const clearStatusLogs = () => {
    ftpStore.clearStatusLogs()
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
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
        addStatusLog('错误: 未连接到服务器')
        return
    }
    
    if (selectedLocalFiles.value.size === 0) {
        addStatusLog('请选择要上传的文件')
        return
    }

    const selectedFilesList = Array.from(selectedLocalFiles.value)
    addStatusLog(`准备上传文件: ${selectedFilesList.join(', ')}`)

    try {
        // 先获取当前路径
        const pwdPayload = {
            cmd: "pwd"
        }
        console.log('发送 pwd 命令:', pwdPayload)
        socket.value.send(JSON.stringify(pwdPayload))

        // 等待 pwd 命令的响应
        const pwdResponse = await handleWebSocketMessage("pwd", (response) => {
            remotePath.value = response.path
            addStatusLog(`当前目录: ${response.path}`)
        })
        console.log('收到 pwd 响应:', pwdResponse)

        // 确保在发送 list 命令之前有一个短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100))
        // 将路径中的左斜杠转换为右斜杠
        const normalizedPath = localPath.value ? localPath.value.replace(/\//g, '\\') : null;
        localPath.value = normalizedPath;
        // 这里添加实际的上传逻辑
        for (const fileName of selectedFilesList) {
            const uploadPayload ={
                cmd:"upload",
                localPath:`${localPath.value}/${fileName}`,
                remotePath:`${remotePath.value}/${fileName}`,
                resume: false
            };
            console.log('发送 upload 命令:', uploadPayload);
            socket.value.send(JSON.stringify(uploadPayload));
        }
        const uploadResponse = await handleWebSocketMessage("upload", (response) => {
                if (response.status === "success") {
                    addStatusLog(`文件 ${fileName} 上传成功`);
                } else {
                    throw new Error(`文件 ${fileName} 上传失败: ${response.error}`);
                }
            });
            console.log('收到 upload 响应:', uploadResponse);
        // 清空选择 - 使用新的空 Set
        selectedLocalFiles.value = new Set()
    } catch (error) {
        addStatusLog(`上传失败: ${error.message}`)
    }
}

const downloadFiles = async () => {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
        addStatusLog('错误: 未连接到服务器')
        return
    }
    
    if (selectedRemoteFiles.value.size === 0) {
        addStatusLog('请选择要下载的文件')
        return
    }

    // 获取输入框的值
    const localDownloadFolder = document.getElementById("downloadPathInput").value;
    if (!localDownloadFolder) {
        addStatusLog('请提供有效的本地下载路径');
        return;
    }
    const selectedFilesList = Array.from(selectedRemoteFiles.value)
    addStatusLog(`准备下载文件: ${selectedFilesList.join(', ')}`)

    try {
        // 先获取当前路径
        const pwdPayload = {
            cmd: "pwd"
        }
        console.log('发送 pwd 命令:', pwdPayload)
        socket.value.send(JSON.stringify(pwdPayload))

        // 等待 pwd 命令的响应
        const pwdResponse = await handleWebSocketMessage("pwd", (response) => {
            remotePath.value = response.path
            addStatusLog(`当前目录: ${response.path}`)
        })
        console.log('收到 pwd 响应:', pwdResponse)

        // 确保在发送 list 命令之前有一个短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100))
        //下载文件夹
        //const localDownloadFolder = `${window.navigator.userAgent.includes('Windows') ? 'C:/Users/' + window.navigator.userName + '/Downloads' : '/home/' + window.navigator.userName + '/Downloads'}`;
        // 这里添加实际的下载逻辑
        for (const fileName of selectedFilesList) {
            const downloadPayload = {
                cmd: "download",
                remotePath: `${remotePath.value}/${fileName}`,
                localPath: `${localDownloadFolder}/${fileName}`,
                resume: false
            };
            console.log('发送 download 命令:', downloadPayload);
            socket.value.send(JSON.stringify(downloadPayload));

            // 等待 download 指令的响应
            const downloadResponse = await handleWebSocketMessage("download", (response) => {
                if (response.status === "success") {
                    addStatusLog(`文件 ${fileName} 下载成功`);
                } else {
                    throw new Error(`文件 ${fileName} 下载失败: ${response.error}`);
                }
            });
            console.log('收到 download 响应:', downloadResponse);
        }
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

const parseFileInfo = (line) => {
    console.log('正在解析文件信息:', line)
    
    // 更简单的正则表达式，主要关注文件类型、大小和名称
    const regex = /^([dl-])[\w-]{9}\s+\d+\s+\d+\s+\d+\s+(\d+)\s+[\w\s:]+\s+(.+?)\r?$/
    const match = regex.exec(line)
    
    if (!match) {
        console.log('文件信息解析失败:', line)
        return null
    }
    
    const type = match[1]      // 'd', 'l', or '-'
    const size = parseInt(match[2])
    let name = match[3]
    
    console.log('解析出的信息:', { type, size, name })  // 添加日志
    
    // 处理符号链接
    if (type === 'l') {
        const [fileName, linkTarget] = name.split(' -> ')
        const result = {
            name: fileName.trim(),
            isDirectory: false,
            isSymlink: true,
            linkTarget: linkTarget ? linkTarget.trim() : null,
            size: size
        }
        console.log('符号链接解析结果:', result)  // 添加日志
        return result
    }
    
    const result = {
        name: name.trim(),
        isDirectory: type === 'd',
        isSymlink: false,
        linkTarget: null,
        size: size
    }
    console.log('普通文件解析结果:', result)  // 添加日志
    return result
}

// 添加一个通用的 WebSocket 消息处理函数
const handleWebSocketMessage = (cmd, callback) => {
    return new Promise((resolve, reject) => {
        const messageHandler = (event) => {
            try {
                const response = JSON.parse(event.data)
                
                // 完全忽略任何包含登录成功的消息
                if (response.message?.includes("anonymous") || 
                    (typeof event.data === 'string' && event.data.includes("anonymous"))) {
                    return
                }

                console.log(`[${cmd}] 收到WebSocket响应:`, event.data)
                console.log(`[${cmd}] 解析后的响应:`, response)

                // 处理不同类型的响应
                if (cmd === "pwd" && response.path !== undefined) {
                    socket.value.removeEventListener('message', messageHandler)
                    clearTimeout(timeoutId)
                    callback(response)
                    resolve(response)
                } else if (cmd === "list" && response.files !== undefined) {
                    socket.value.removeEventListener('message', messageHandler)
                    clearTimeout(timeoutId)
                    callback(response)
                    resolve(response)
                } else if (cmd === "cd" && response.status === "success") {
                    socket.value.removeEventListener('message', messageHandler)
                    clearTimeout(timeoutId)
                    callback(response)
                    resolve(response)
                } else if (cmd === "download" && response.status === "success") {
                    socket.value.removeEventListener('message', messageHandler)
                    clearTimeout(timeoutId)
                    callback(response)
                    resolve(response)
                } else if (cmd === "upload" && response.status === "success") {
                    socket.value.removeEventListener('message', messageHandler)
                    clearTimeout(timeoutId)
                    callback(response)
                    resolve(response)
                }else if (cmd === "mkdir" && response.status === "success") {
                    socket.value.removeEventListener('message', messageHandler)
                    clearTimeout(timeoutId)
                    callback(response)
                    resolve(response)
                }else if (cmd === "delete" && response.status === "success") {
                    socket.value.removeEventListener('message', messageHandler)
                    clearTimeout(timeoutId)
                    callback(response)
                    resolve(response)
                }else if (cmd === "setTransferMode" && response.status === "success") {
                    socket.value.removeEventListener('message', messageHandler)
                    clearTimeout(timeoutId)
                    callback(response)
                    resolve(response)
                }

            } catch (error) {
                console.error(`[${cmd}] 处理WebSocket消息时出错:`, error)
                socket.value.removeEventListener('message', messageHandler)
                clearTimeout(timeoutId)
                reject(error)
            }
        }
        
        socket.value.addEventListener('message', messageHandler)
        
        const timeoutId = setTimeout(() => {
            socket.value.removeEventListener('message', messageHandler)
            reject(new Error(`命令 ${cmd} 响应超时`))
        }, 5000)
    })
}

// 修改 refreshRemoteFiles 函数
const refreshRemoteFiles = async () => {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
        addStatusLog('错误: 未连接到服务器')
        return
    }
    try {
        // 先获取当前路径
        const pwdPayload = {
            cmd: "pwd"
        }
        console.log('发送 pwd 命令:', pwdPayload)
        socket.value.send(JSON.stringify(pwdPayload))

        // 等待 pwd 命令的响应
        const pwdResponse = await handleWebSocketMessage("pwd", (response) => {
            remotePath.value = response.path
            addStatusLog(`当前目录: ${response.path}`)
        })
        console.log('收到 pwd 响应:', pwdResponse)

        // 确保在发送 list 命令之前有一个短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100))

        // 根据获取到的路径发送 list 命令
        const listPayload = {
            cmd: "list",
            path: remotePath.value
        }
        console.log('发送 list 命令:', listPayload)
        socket.value.send(JSON.stringify(listPayload))

        // 等待 list 命令的响应
        const listResponse = await handleWebSocketMessage("list", (response) => {
            const parsedFiles = response.files
                .map(line => {
                    const parsed = parseFileInfo(line)
                    console.log('解析结果:', line, '=>', parsed)
                    return parsed
                })
                .filter(file => file !== null)
            
            console.log('最终文件列表:', parsedFiles)
            remoteFiles.value = parsedFiles
            addStatusLog('文件列表已更新')
        })
        console.log('收到 list 响应:', listResponse)
    } catch (error) {
        console.error('刷新文件列表时出错:', error)
        addStatusLog(`刷新失败: ${error.message}`)
    }
}

const createNewFolder = async () => {
    try {
        // 新文件夹名字
        const folderName = document.getElementById("mkdirNameInput").value;
        if (!folderName) {
            addStatusLog(`请输入新建文件夹名称`)
            return
        }
        addStatusLog(`正在创建文件夹: ${folderName}`)
        // 先获取当前路径
        const pwdPayload = {
            cmd: "pwd"
        }
        console.log('发送 pwd 命令:', pwdPayload)
        socket.value.send(JSON.stringify(pwdPayload))

        // 等待 pwd 命令的响应
        const pwdResponse = await handleWebSocketMessage("pwd", (response) => {
            remotePath.value = response.path
            addStatusLog(`当前目录: ${response.path}`)
        })
        console.log('收到 pwd 响应:', pwdResponse)

        // 确保在发送 mkdir 命令之前有一个短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 根据路径发送 mkdir命令
        const mkdirPayload={
            cmd:"mkdir",
            path:`${remotePath.value}/${folderName}`
        }
        console.log('发送 mkdir 命令:', mkdirPayload)
        socket.value.send(JSON.stringify(mkdirPayload))
        // 等待 mkdir 指令的响应
        const mkdirResponse = await handleWebSocketMessage("mkdir", (response) => {
                if (response.status === "success") {
                    addStatusLog(`文件夹 ${folderName} 创建成功`);
                } else {
                    throw new Error(`文件夹 ${folderName} 创建失败: ${response.error}`);
                }
            });
            console.log('收到 mkdir 响应:', mkdirResponse);
        
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
        // 先获取当前路径
        const pwdPayload = {
            cmd: "pwd"
        }
        console.log('发送 pwd 命令:', pwdPayload)
        socket.value.send(JSON.stringify(pwdPayload))

        // 等待 pwd 命令的响应
        const pwdResponse = await handleWebSocketMessage("pwd", (response) => {
            remotePath.value = response.path
            addStatusLog(`当前目录: ${response.path}`)
        })
        console.log('收到 pwd 响应:', pwdResponse)

        // 确保在发送 delete 命令之前有一个短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100))
        // 发送delete命令
        for (const fileName of selectedFilesList) {
            const deletePayload = {
                cmd: "delete",
                path: `${remotePath.value}/${fileName}`,
            };
            console.log('发送 delete 命令:', deletePayload);
            socket.value.send(JSON.stringify(deletePayload));

            // 等待 delete 指令的响应
            const deleteResponse = await handleWebSocketMessage("delete", (response) => {
                if (response.status === "success") {
                    addStatusLog(`文件 ${fileName} 删除成功`);
                } else {
                    throw new Error(`文件 ${fileName} 删除失败: ${response.error}`);
                }
            });
            console.log('收到 delete 响应:', deleteResponse);
        }
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

// 修改 navigateRemoteDirectory 函数
const navigateRemoteDirectory = async (dirName) => {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
        addStatusLog('错误: 未连接到服务器')
        return
    }

    const newPath = path.posix.join(remotePath.value, dirName)
    try {
        addStatusLog(`正在进入目录: ${newPath}`)
        
        // 先发送 cd 命令
        const cdPayload = {
            cmd: "cd",
            path: newPath
        }
        socket.value.send(JSON.stringify(cdPayload))

        // 等待 cd 命令的响应
        await handleWebSocketMessage("cd", () => {
            addStatusLog(`成功切换到目录: ${newPath}`)
        })

        // 获取当前路径
        const pwdPayload = {
            cmd: "pwd"
        }
        socket.value.send(JSON.stringify(pwdPayload))

        // 等待 pwd 命令的响应
        await handleWebSocketMessage("pwd", (response) => {
            remotePath.value = response.path
        })

        // 获取文件列表
        const listPayload = {
            cmd: "list"
        }
        socket.value.send(JSON.stringify(listPayload))

        await handleWebSocketMessage("list", (response) => {
            remoteFiles.value = response.files
                .map(line => parseFileInfo(line))
                .filter(file => file !== null)
            addStatusLog(`已获取目录内容`)
        })
    } catch (error) {
        addStatusLog(`导航失败: ${error.message}`)
    }
}

// 修改 goToParentRemoteDirectory 函数
const goToParentRemoteDirectory = async () => {
    if (remotePath.value === '/') {
        addStatusLog('已经是根目录')
        return
    }

    try {
        // 发送 cd 命令切换到上级目录
        const cdPayload = {
            cmd: "cd",
            path: ".."  // 使用 .. 表示上级目录
        }
        socket.value.send(JSON.stringify(cdPayload))

        // 等待 cd 命令的响应
        await handleWebSocketMessage("cd", () => {
            addStatusLog(`成功切换到上级目录`)
        })

        // 获取当前路径
        const pwdPayload = {
            cmd: "pwd"
        }
        socket.value.send(JSON.stringify(pwdPayload))

        // 等待 pwd 命令的响应
        await handleWebSocketMessage("pwd", (response) => {
            remotePath.value = response.path
        })

        // 获取文件列表
        const listPayload = {
            cmd: "list"
        }
        socket.value.send(JSON.stringify(listPayload))

        await handleWebSocketMessage("list", (response) => {
            remoteFiles.value = response.files
                .map(line => parseFileInfo(line))
                .filter(file => file !== null)
            addStatusLog(`已获取目录内容`)
        })
    } catch (error) {
        addStatusLog(`返回上级目录失败: ${error.message}`)
    }
}

const handleRemoteFileClick = (file) => {
    if (file.isDirectory) {
        navigateRemoteDirectory(file.name)
    } else {
        toggleFileSelection('remote', file.name)
    }
}

// 在组件挂载时检查连接
onMounted(() => {
    // 检查 socket 连接状态
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
        addStatusLog('错误: WebSocket 连接已断开')
        ftpStore.resetConnection()  // 重置连接状态
        router.push('/')
        return
    }

    addStatusLog(`已连接到服务器: ${connectionInfo.value.host}:${connectionInfo.value.port}`)
    
    // 设置 WebSocket 事件监听
    socket.value.onclose = () => {
        addStatusLog('与服务器的连接已断开')
        ftpStore.resetConnection()  // 重置连接状态
        router.push('/')
    }

    socket.value.onerror = (error) => {
        addStatusLog(`WebSocket 错误: ${error.message}`)
    }

    // 刷新远程文件列表（使用当前路径）
    refreshRemoteFiles()
})

// 在 remotePath 变化时输出日志
watch(remotePath, (newPath) => {
    console.log('远程路径已更新:', newPath)
})

const transferMode = ref(false); // false: 被动模式, true: 主动模式

const toggleTransferMode = async () => {
    transferMode.value = !transferMode.value;
    console.log(`当前传输模式: ${transferMode.value ? '主动模式' : '被动模式'}`);
    try{
        // 设置setTransferType
        const setTransferModePayload={
            cmd:"setTransferMode",
            mode:`${transferMode.value ? 'ACTIVE' : 'PASSIVE'}`
        }
        console.log('发送 setTransferMode 命令:', setTransferModePayload)
        socket.value.send(JSON.stringify(setTransferModePayload))
        // 等待 setTransferMode 指令的响应
        const setTransferModeResponse = await handleWebSocketMessage("setTransferMode", (response) => {
                if (response.status === "success") {
                    addStatusLog(`当前传输模式: ${transferMode.value ? '主动模式' : '被动模式'}`);
                } else {
                    throw new Error(`模式更改失败 ${response.error}`);
                }
            });
            console.log('收到 setTransferMode 响应:', setTransferModeResponse);
    }catch(error) {
        addStatusLog(`设置模式失败: ${error.message}`)
    }
};
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
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 1rem;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.25rem;
}

.file-info {
    display: flex;
    gap: 1rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
    justify-self: end;
}

.file-permissions {
    font-family: monospace;
    white-space: nowrap;
}

.link-target {
    color: var(--text-secondary);
    margin-left: 0.5rem;
    font-style: italic;
}

.file-icon {
    width: 1.25rem;
    height: 1.25rem;
}

.file-item[data-is-directory="true"] .file-icon {
    color: var(--primary-color);
}

.file-item[data-is-symlink="true"] .file-icon {
    color: var(--accent-color);
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

.file-size {
    color: var(--text-secondary);
    font-size: 0.9rem;
    justify-self: end;
}

.link-target {
    color: var(--text-secondary);
    margin-left: 0.5rem;
    font-style: italic;
}

.file-icon {
    width: 1.25rem;
    height: 1.25rem;
}
.transfer-mode-toggle {
    display: flex;
    align-items: center;
    justify-content: flex-end; /* 靠右对齐 */
    gap: 10px;
    margin-right: 40px;
    margin-top: -65px;
}

.mode-label {
    font-size: 16px;
    font-weight: bold;
}

.switch {
    width: 50px;
    height: 25px;
    background-color: #ccc;
    border-radius: 15px;
    position: relative;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.switch.active {
    background-color: #4caf50;
}

.switch-handle {
    width: 20px;
    height: 20px;
    background-color: #fff;
    border-radius: 50%;
    position: absolute;
    top: 2.5px;
    left: 2.5px;
    transition: left 0.3s ease;
}

.switch.active .switch-handle {
    left: 27.5px;
}
</style>