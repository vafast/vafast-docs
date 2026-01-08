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
        <div class="flex flex-col justify-center items-center transition-all">
            <div class="flex items-center gap-3 mb-2">
                <img
                    :src="asset('assets/vafast.svg')"
                    alt="Vafast"
                    class="w-16 h-16 md:w-20 md:h-20"
                />
                <h1
                    class="text-5xl md:text-6xl leading-relaxed font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
                >
                    Vafast
                </h1>
            </div>
            <h2
                class="relative md:leading-tight font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-violet-400 mb-6 text-4xl md:text-5xl text-center"
            >
                高性能 TypeScript Web 框架
            </h2>
            <h3
                class="text-xl md:text-2xl text-gray-500 dark:text-gray-400 !leading-normal w-full max-w-2xl text-center"
            >
                <span
                    class="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
                    >声明式路由</span
                >
                · 端到端类型安全 ·
                <span
                    class="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400"
                    >~101K reqs/s</span
                >
            </h3>
            <section
                class="flex flex-col sm:flex-row items-center w-full md:w-auto gap-4 mt-8 mb-12"
            >
                <a
                    class="hero-btn text-white font-semibold text-lg bg-pink-400 dark:bg-pink-500 px-6 py-2.5 rounded-full transform hover:scale-110"
                    id="hero-get-started"
                    href="/at-glance"
                >
                    开始使用
                </a>
                <div class="relative flex flex-1 gap-3 text-pink-500">
                    <code
                        class="text-pink-500 font-mono font-medium text-lg bg-pink-200/25 dark:bg-pink-500/20 px-6 py-2.5 rounded-full"
                    >
                        npm i vafast
                    </code>
                    <button
                        id="hero-copy"
                        class="hero-btn hidden sm:inline-flex p-3 rounded-xl active:rounded-4xl interact:bg-pink-200/25 active:bg-pink-200/50 interact:dark:bg-pink-500/20 active:dark:bg-pink-500/20 transform hover:scale-110"
                        :class="{ '!rounded-4xl': copied }"
                        @click="copied = true"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="feather feather-copy"
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
                    </button>
                    <p v-if="copied" class="absolute -bottom-8 right-0">
                        已复制
                    </p>
                </div>
            </section>
            <p class="flex justify-center items-center gap-2 text-gray-400">
                了解为什么开发者喜欢 Vafast
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-6 h-6 motion-safe:animate-bounce"
                >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
            </p>
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
        navigator.clipboard.writeText('npm i vafast')

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
    transition:
        all 0.35s cubic-bezier(0.68, -0.6, 0.32, 1.6),
        color 0.35s ease-out;
}
</style>
