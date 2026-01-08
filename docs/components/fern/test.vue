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
        id="test-with-confidence"
        class="relative max-w-5xl w-full mx-auto py-20 px-6"
        ref="scope"
    >
        <div class="flex flex-col items-center gap-10">
            <!-- 顶部文案 -->
            <div class="text-center max-w-2xl">
                <motion.p
                    class="text-sm font-medium text-violet-500 mb-2"
                    v-bind="flyIn()"
                >
                    编译时检查
                </motion.p>
                <motion.h2
                    class="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-gray-100"
                    v-bind="flyIn(0.1)"
                >
                    错误提前暴露
                </motion.h2>
                <motion.p
                    class="text-gray-500 dark:text-gray-400 leading-relaxed"
                    v-bind="flyIn(0.2)"
                >
                    缺少字段、类型不对？写代码时 IDE 就会提示，不用等到运行才发现问题。配合 <code class="text-violet-500 font-mono text-sm">@vafast/api-client</code>，测试代码也能享受完整的类型推断。
                </motion.p>
            </div>

            <!-- 代码展示 -->
            <motion.div
                class="w-full max-w-3xl"
                v-bind="flyIn(0.4)"
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
                        <slot name="test-code" />
                    </div>
                </div>
            </motion.div>
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
