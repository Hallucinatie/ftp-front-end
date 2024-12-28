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
            </section>

            <!-- Operations -->
            <section class="card operations-section">
                <h2 class="section-title">Operations</h2>
                <div class="button-grid">
                    <button @click="connectToServer" class="action-button">
                        <Plug2 class="button-icon" /> Connect
                    </button>
                    <button @click="loginToServer" class="action-button">
                        <LogIn class="button-icon" /> Login
                    </button>
                    <button @click="listFiles" class="action-button">
                        <Files class="button-icon" /> List Files
                    </button>
                    <button @click="currentDirectory" class="action-button">
                        <Folder class="button-icon" /> Current Directory
                    </button>
                    <button @click="enterPubDirectory" class="action-button">
                        <FolderOpen class="button-icon" /> Enter pub Directory
                    </button>
                    <button @click="disconnectFromServer" class="action-button">
                        <Power class="button-icon" /> Disconnect
                    </button>
                </div>
            </section>

            <!-- Status Information -->
            <section class="card status-section">
                <h2 class="section-title">Status Information</h2>
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
import { Sun, Moon, Server, Hash, User, Lock, Plug2, LogIn, Files, Folder, FolderOpen, Power } from 'lucide-vue-next'

const host = ref('')
const port = ref('')
const username = ref('')
const password = ref('')
const statusLogs = ref([])
const isDarkMode = ref(false)

const addStatusLog = (message) => {
    statusLogs.value = [...statusLogs.value.slice(-9), message]
}

const connectToServer = () => {
    if (host.value && port.value) {
        addStatusLog(`Attempting to connect to ${host.value}:${port.value}...`)
        setTimeout(() => {
            addStatusLog(`Successfully connected to server ${host.value}:${port.value}`)
        }, 1000)
    } else {
        addStatusLog('Connection failed: Host and port cannot be empty!')
    }
}

const loginToServer = () => {
    if (username.value && password.value) {
        addStatusLog(`Attempting to log in as ${username.value}...`)
        setTimeout(() => {
            addStatusLog(`User ${username.value} logged in successfully!`)
        }, 1000)
    } else {
        addStatusLog('Login failed: Username and password cannot be empty!')
    }
}

const listFiles = () => {
    addStatusLog('Listing files...')
    setTimeout(() => {
        addStatusLog('File list retrieved successfully: file1.txt, file2.jpg, ...')
    }, 1000)
}

const currentDirectory = () => {
    addStatusLog('Getting current directory...')
    setTimeout(() => {
        addStatusLog('Current directory: /home/user/')
    }, 1000)
}

const enterPubDirectory = () => {
    addStatusLog('Entering pub directory...')
    setTimeout(() => {
        addStatusLog('Successfully entered pub directory!')
    }, 1000)
}

const disconnectFromServer = () => {
    addStatusLog('Disconnecting...')
    setTimeout(() => {
        addStatusLog('Connection closed.')
    }, 1000)
}

const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
}
</script>

<style scoped>
@import '../style.css';
.app {
    --primary-color: #0070f3;
    --bg-color: #f5f5f7;
    --card-bg: #ffffff;
    --text-color: #000000;
    --border-color: #e5e5e5;
    --button-hover: #0051a2;
    --status-bg: #f0f0f0;

    min-height: 100vh;
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: all 0.3s ease;
}

.app.dark {
    --bg-color: #000000;
    --card-bg: #1c1c1e;
    --text-color: #ffffff;
    --border-color: #2c2c2e;
    --button-hover: #0062d3;
    --status-bg: #2c2c2e;
}

.header {
    background-color: var(--card-bg);
    padding: 2rem;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
}

.header-content {
    max-width: 2400px;
    margin: 0 auto;
}

.title {
    font-size: 2.5rem;
    font-weight: bold;
    margin: 0;
    color: var(--text-color);
    background: linear-gradient(45deg, #0070f3, #00c6ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.subtitle {
    font-size: 1.2rem;
    color: #666;
    margin: 0.5rem 0 0;
}

.theme-toggle {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background-color 0.3s ease;
}

.theme-toggle:hover {
    background-color: var(--border-color);
}

.icon {
    width: 1.5rem;
    height: 1.5rem;
    color: var(--text-color);
}

.main-content {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 3rem 1rem 0 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.card {
    background-color: var(--card-bg);
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    flex: 1 1 300px;
    display: flex;
    flex-direction: column;
    width: 80%; 
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.section-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--text-color);
    border-bottom: 2px solid var(--primary-color);
    padding-bottom: 0.5rem;
}

.input-group {
    margin-bottom: 1.5rem;
    width: 80%;
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
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background-color: var(--bg-color);
    color: var(--text-color);
    font-size: 1rem;
    transition: all 0.3s ease;
}

.input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.1);
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

.button-grid {
    display: grid;
    grid-template-rows: repeat(auto-fit, minmax(50px, 1fr));
    align-items: center; /* 垂直居中 */
    gap: 1rem;
}

.button-grid button {
    width: 90%;
    margin: 0 auto; /* 水平居中 */
}

.action-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-button:hover {
    background-color: var(--button-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.button-icon {
    margin-right: 0.5rem;
    width: 1.25rem;
    height: 1.25rem;
}

.status-container {
    height: 380px;
    overflow-y: auto;
    border-radius: 0.5rem;
    background-color: var(--status-bg);
    padding: 0.5rem;
}

.status-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column-reverse;
}

.status-container::-webkit-scrollbar {
    width: 8px;
}

.status-container::-webkit-scrollbar-track {
    background: var(--bg-color);
    border-radius: 4px;
}

.status-container::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
}

.status-container::-webkit-scrollbar-thumb:hover {
    background: var(--primary-color);
}

.status-item {
    padding: 0.75rem 1rem;
    background-color: var(--card-bg);
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

@media (max-width: 768px) {
    .main-content {
        grid-template-columns: 1fr;
    }

    .header {
        padding: 1rem;
    }

    .title {
        font-size: 2rem;
    }

    .card {
        padding: 1.5rem;
    }
}
</style>