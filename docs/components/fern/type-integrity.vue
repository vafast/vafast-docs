<template>
    <section
        id="type-integrity"
        class="relative max-w-5xl w-full mx-auto py-20 px-6"
        ref="scope"
    >
        <!-- 标题 -->
        <div class="text-center mb-12">
            <motion.p
                class="text-sm font-medium text-cyan-500 mb-2"
                v-bind="flyIn()"
            >
                更先进的开发体验
            </motion.p>
            <motion.h2
                class="text-4xl md:text-5xl font-bold"
                v-bind="flyIn(0.1)"
            >
                <span class="text-gray-800 dark:text-gray-100">端到端</span>
                <span
                    class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500"
                >
                    类型安全
                </span>
            </motion.h2>
        </div>

        <!-- 代码展示窗口 -->
        <motion.div
            layout
            class="mx-auto w-full max-w-4xl rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            v-bind="flyIn(0.2)"
            :transition="{
                duration: 0.5,
                ease: cubicBezier(0.16, 1, 0.3, 1)
            }"
        >
            <!-- 窗口控制按钮 -->
            <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div class="w-3 h-3 rounded-full bg-red-400" />
                <div class="w-3 h-3 rounded-full bg-yellow-400" />
                <div class="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <!-- 代码内容 -->
            <div class="code-body">
                <div v-if="form === 1"><slot name="type-1" /></div>
                <div v-else-if="form === 2"><slot name="type-2" /></div>
                <div v-else-if="form === 3"><slot name="type-3" /></div>
                <div v-else-if="form === 4"><slot name="type-4" /></div>
            </div>
        </motion.div>

        <!-- 选项卡 -->
        <div class="flex justify-center mt-8">
            <div
                class="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-full"
            >
                <button
                    v-for="(label, index) in labels"
                    :key="label"
                    class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200"
                    :class="
                        form === index + 1
                            ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    "
                    @click="form = index + 1"
                >
                    {{ label }}
                </button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useInView, motion, cubicBezier } from 'motion-v'
import { useFlyIn } from './animate'

const scope = ref(null)
const isInView = useInView(scope, {
    once: true,
    margin: '0px 0px -20% 0px'
} as Parameters<typeof useInView>[1])
const flyIn = useFlyIn(isInView)

const form = ref(0)
const labels = ['路径参数', 'Schema 验证', '错误处理', '额外上下文']

// 进入视图后默认选中第一个 tab
watch(isInView, () => {
    if (isInView) {
        setTimeout(() => {
            form.value = 1
        }, 200)
    }
})
</script>

<style scoped>
.code-body :deep(*) {
    background: transparent !important;
}

.code-body :deep(pre) {
    padding: 1rem !important;
    margin: 0;
}
</style>
