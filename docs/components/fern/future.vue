<script setup lang="ts">
import { ref } from 'vue'
import { useInView, motion } from 'motion-v'
import { useFlyIn } from './animate'

const scope = ref(null)
const isInView = useInView(scope, {
    once: true,
    margin: '0px 0px -20% 0px'
} as Parameters<typeof useInView>[1])
const flyIn = useFlyIn(isInView)
</script>

<template>
    <section
        class="relative max-w-5xl w-full mx-auto py-20 px-6"
        ref="scope"
    >
        <!-- 背景装饰 -->
        <div
            class="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent dark:from-violet-500/10 rounded-3xl pointer-events-none"
        />

        <div
            class="relative flex flex-col md:flex-row md:items-center justify-between gap-8"
        >
            <!-- 文案 -->
            <div>
                <motion.h2
                    class="text-4xl md:text-5xl font-bold mb-4 text-gray-800 dark:text-gray-100"
                    v-bind="flyIn()"
                >
                    准备好了吗？
                </motion.h2>
                <motion.p
                    class="text-gray-500 dark:text-gray-400 max-w-md"
                    v-bind="flyIn(0.1)"
                >
                    几分钟搭建你的第一个 Vafast 项目，体验高效的 API 开发
                </motion.p>
            </div>

            <!-- 按钮 -->
            <motion.div
                class="flex flex-wrap gap-4"
                v-bind="flyIn(0.2)"
            >
                <a
                    href="/at-glance"
                    class="inline-flex items-center px-6 py-3 text-violet-600 dark:text-violet-400 font-semibold bg-violet-100 dark:bg-violet-500/20 rounded-full hover:bg-violet-200 dark:hover:bg-violet-500/30 transition-colors"
                >
                    快速开始
                </a>
                <a
                    href="/tutorial"
                    class="inline-flex items-center px-6 py-3 text-white font-semibold bg-gradient-to-r from-violet-500 to-sky-500 rounded-full shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 hover:scale-105"
                >
                    教程
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="ml-2"
                    >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </a>
            </motion.div>
        </div>
    </section>
</template>
