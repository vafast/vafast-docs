<template>
    <Ray
        class="h-[60vh] -top-16 pointer-events-none opacity-[.35] dark:opacity-50"
    />
    <div
        id="splash"
        class="pointer-events-none absolute top-[-70vh] max-w-full justify-center w-full h-screen opacity-25 block gradient"
    ></div>
    <header
        class="relative flex flex-col justify-center items-center w-full pt-6 md:pt-0 mb-16 md:mb-8 px-6 overflow-hidden transition-all"
        style="min-height: calc(100vh - 64px)"
    >
        <div class="flex flex-col justify-center items-center transition-all max-w-4xl">
            <!-- Logo -->
            <div class="flex items-center gap-4 mb-8">
                <img
                    :src="asset('assets/vafast.svg')"
                    alt="Vafast"
                    class="w-16 h-16 md:w-20 md:h-20"
                />
            </div>

            <!-- 主标题 - 分行展示 -->
            <h1
                class="text-4xl md:text-6xl lg:text-7xl font-bold text-center leading-tight md:leading-tight lg:leading-tight mb-6"
            >
                <span class="text-gray-700 dark:text-gray-200">构建现代</span>
                <br />
                <span
                    class="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-sky-400"
                >
                    高性能 API
                </span>
            </h1>

            <!-- 副标题 -->
            <p
                class="text-lg md:text-xl text-gray-500 dark:text-gray-400 text-center max-w-2xl mb-4 leading-relaxed"
            >
                声明式路由 · 自动类型推断 · Schema 验证
            </p>

            <!-- 支持的运行时 -->
            <p
                class="text-sm md:text-base text-gray-400 dark:text-gray-500 text-center mb-10"
            >
                支持 Node.js / Bun / Cloudflare Workers
            </p>

            <!-- CTA 区域 -->
            <section
                class="flex flex-col sm:flex-row items-center w-full md:w-auto gap-4 mb-12"
            >
                <a
                    class="hero-btn text-white font-semibold text-lg bg-gradient-to-r from-violet-500 to-sky-500 px-8 py-3 rounded-full transform hover:scale-105 shadow-lg shadow-violet-500/25"
                    id="hero-get-started"
                    href="/at-glance"
                >
                    快速开始
                </a>
                <div class="relative flex items-center gap-2">
                    <code
                        class="text-gray-600 dark:text-gray-300 font-mono text-sm md:text-base bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-full border border-gray-200 dark:border-gray-700"
                    >
                        <span class="text-gray-400 mr-2">$</span>npx create-vafast-app
                    </code>
                    <button
                        id="hero-copy"
                        class="hero-btn p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-violet-500 hover:border-violet-300 dark:hover:border-violet-500 transition-colors"
                        :class="{ 'text-green-500 border-green-300': copied }"
                        @click="copied = true"
                    >
                        <svg
                            v-if="!copied"
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                            />
                            <path
                                d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                            />
                        </svg>
                        <svg
                            v-else
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </button>
                </div>
            </section>

            <!-- 向下滚动提示 -->
            <div class="flex flex-col items-center gap-2 text-gray-400 text-sm">
                <span>向下滚动了解更多</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="motion-safe:animate-bounce"
                >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useData } from 'vitepress'

import Ray from './ray.vue'

const { site } = useData()
const asset = (path: string) => {
    const base = site.value.base
    const normalized = path.startsWith('/') ? path.slice(1) : path
    return `${base}${normalized}`
}

const copied = ref(false)
watch(copied, (value) => {
    if (value && window.isSecureContext) {
        navigator.clipboard.writeText('npx create-vafast-app')

        setTimeout(() => {
            copied.value = false
        }, 2000)
    }
})
</script>

<style scoped>
.gradient {
    width: 1100px;
    height: 1100px;
    background: radial-gradient(
        ellipse at center,
        #d7e0ff 0%,
        #eaecff 35%,
        transparent 70%
    );
}

.dark .gradient {
    background: radial-gradient(
        ellipse at center,
        #797ee199 0%,
        transparent 70%
    );
}

.hero-btn {
    transition: all 0.3s ease;
}
</style>
