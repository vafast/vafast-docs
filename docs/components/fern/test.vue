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
        <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <!-- 左侧文案 -->
            <div class="flex-1 lg:max-w-md">
                <motion.p
                    class="text-sm font-medium text-violet-500 mb-2"
                    v-bind="flyIn()"
                >
                    开发者体验
                </motion.p>
                <motion.h2
                    class="text-4xl md:text-5xl font-bold mb-6"
                    v-bind="flyIn(0.1)"
                >
                    <span class="text-gray-800 dark:text-gray-100">充满信心地</span>
                    <br />
                    <span
                        class="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-sky-400"
                    >
                        进行测试
                    </span>
                </motion.h2>
                <motion.p
                    class="text-gray-500 dark:text-gray-400 mb-4 leading-relaxed"
                    v-bind="flyIn(0.2)"
                >
                    类型错误在编译时暴露，而非运行时。缺少必填字段？类型不匹配？IDE 立即标红。
                </motion.p>
                <motion.p
                    class="text-gray-500 dark:text-gray-400 leading-relaxed"
                    v-bind="flyIn(0.3)"
                >
                    结合
                    <span
                        class="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-sky-400 font-semibold"
                    >
                        @vafast/api-client
                    </span>
                    ，端到端类型安全，测试代码也能享受完整的类型推断。
                </motion.p>
            </div>

            <!-- 右侧代码展示 -->
            <motion.div
                class="flex-1 w-full lg:max-w-xl"
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
.code-body :deep(> div) {
    background: transparent !important;
}

.code-body :deep(> div > pre) {
    padding: 1rem !important;
    margin: 0;
}
</style>
