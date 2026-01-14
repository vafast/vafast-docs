<template>
    <section
        id="e2e-communication"
        class="relative max-w-5xl w-full mx-auto py-20 px-6"
        ref="scope"
    >
        <!-- 标题 -->
        <div class="text-center mb-12">
            <motion.h2
                class="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100"
                v-bind="flyIn()"
            >
                类型自动同步
            </motion.h2>
            <motion.p
                class="mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
                v-bind="flyIn(0.1)"
            >
                服务端定义好接口，客户端自动获得完整类型提示，不用手动写类型、不用生成代码。
            </motion.p>
        </div>

        <!-- 代码展示 -->
        <div class="grid md:grid-cols-2 gap-6">
            <!-- 服务端代码 -->
            <motion.div
                class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                v-bind="flyIn(0.2)"
            >
                <!-- 窗口头部 -->
                <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div class="w-3 h-3 rounded-full bg-red-400" />
                    <div class="w-3 h-3 rounded-full bg-yellow-400" />
                    <div class="w-3 h-3 rounded-full bg-green-400" />
                    <span class="ml-2 text-sm text-gray-500 dark:text-gray-400 font-mono">server.ts</span>
                </div>
                <!-- 代码内容 -->
                <div class="code-body">
                    <slot name="server" />
                </div>
            </motion.div>

            <!-- 客户端代码 -->
            <motion.div
                class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                v-bind="flyIn(0.3)"
            >
                <!-- 窗口头部 -->
                <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div class="w-3 h-3 rounded-full bg-red-400" />
                    <div class="w-3 h-3 rounded-full bg-yellow-400" />
                    <div class="w-3 h-3 rounded-full bg-green-400" />
                    <span class="ml-2 text-sm text-gray-500 dark:text-gray-400 font-mono">client.ts</span>
                </div>
                <!-- 代码内容 -->
                <div class="code-body">
                    <slot name="client" />
                </div>
            </motion.div>
        </div>

        <!-- 说明文字 -->
        <motion.div
            class="mt-8 flex flex-wrap justify-center gap-6 text-sm"
            v-bind="flyIn(0.4)"
        >
            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>自动类型推断</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>零配置同步</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>编译时检查</span>
            </div>
        </motion.div>
    </section>
</template>

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

<style scoped>
.code-body {
    height: 700px;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
}

.code-body :deep(*) {
    background: transparent !important;
}

/* 确保所有代码容器填充高度 */
.code-body :deep(div[class*='language-']),
.code-body :deep([class*='shiki']),
.code-body :deep([class*='github-light']),
.code-body :deep([class*='github-dark']),
.code-body :deep(.twoslash) {
    margin: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    min-height: 100% !important;
}

/* Pre 元素填充高度 */
.code-body :deep(div[class*='language-'] > pre),
.code-body :deep([class*='shiki'] > pre),
.code-body :deep(.twoslash > pre),
.code-body :deep(pre[class*='language-']) {
    margin: 0 !important;
    padding: 1rem !important;
    font-size: 14px !important;
    flex: 1 !important;
    min-height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: visible !important;
}

/* Code 元素 */
.code-body :deep(div[class*='language-'] > pre > code),
.code-body :deep(pre > code),
.code-body :deep(code[class*='language-']) {
    display: block !important;
    width: 100% !important;
    flex: 1 !important;
}

/* Twoslash 特定元素 */
.code-body :deep(.twoslash-popup),
.code-body :deep(.twoslash-query),
.code-body :deep(.twoslash-error) {
    position: relative;
}
</style>
