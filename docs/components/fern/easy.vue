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

const principles = [
    {
        icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
        title: '自动响应',
        desc: '返回对象自动转 JSON，字符串自动 text/plain'
    },
    {
        icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01',
        title: '语义化错误',
        desc: 'err.notFound() 统一的错误响应格式'
    },
    {
        icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
        title: '声明式路由',
        desc: '路由是数组，一眼看清所有 API 端点'
    },
    {
        icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
        title: '跨运行时',
        desc: 'Node.js / Bun / Workers 同一套代码'
    }
]
</script>

<template>
    <section
        id="made-for-human"
        class="relative max-w-5xl w-full mx-auto py-20 px-6"
        ref="scope"
    >
        <div class="flex flex-col gap-10 items-center">
            <!-- 顶部文案 -->
            <div class="text-center max-w-2xl">
                <motion.p
                    class="text-sm font-medium text-violet-500 mb-2"
                    v-bind="flyIn()"
                >
                    设计原则
                </motion.p>
                <motion.h2
                    class="text-4xl md:text-5xl font-bold mb-6"
                    v-bind="flyIn(0.1)"
                >
                    <span class="text-gray-800 dark:text-gray-100">开发者</span>
                    <br />
                    <span
                        class="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-500"
                    >
                        优先
                    </span>
                </motion.h2>
                <motion.p
                    class="text-gray-500 dark:text-gray-400 mb-4 leading-relaxed"
                    v-bind="flyIn(0.2)"
                >
                    符合直觉的 API 设计，零学习成本上手。
                </motion.p>
                <motion.p
                    class="text-gray-500 dark:text-gray-400 leading-relaxed"
                    v-bind="flyIn(0.3)"
                >
                    拒绝过度抽象，
                    <span
                        class="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-sky-400 font-semibold"
                    >
                        写你所想，即你所得。
                    </span>
                </motion.p>
            </div>

            <!-- 代码展示 -->
            <motion.div
                class="w-full max-w-3xl"
                v-bind="flyIn(0.3)"
            >
                <div
                    class="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                    <!-- 窗口控制按钮 -->
                    <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div class="w-3 h-3 rounded-full bg-red-400" />
                        <div class="w-3 h-3 rounded-full bg-yellow-400" />
                        <div class="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div class="code-body">
                        <slot />
                    </div>
                </div>
            </motion.div>
        </div>

        <!-- 底部特性网格 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <motion.article
                v-for="(item, index) in principles"
                :key="item.title"
                class="flex flex-col"
                v-bind="flyIn(0.4 + index * 0.1)"
            >
                <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800 mb-3"
                >
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
                        class="text-gray-600 dark:text-gray-300"
                    >
                        <path :d="item.icon" />
                    </svg>
                </div>
                <h4
                    class="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1"
                >
                    {{ item.title }}
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ item.desc }}
                </p>
            </motion.article>
        </div>
    </section>
</template>

<style scoped>
.code-body :deep(*) {
    background: transparent !important;
}

.code-body :deep(pre) {
    padding: 1rem !important;
    margin: 0;
}
</style>
