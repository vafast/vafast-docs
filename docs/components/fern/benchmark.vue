<script setup lang="ts">
import { ref } from 'vue'
import { useInView, motion } from 'motion-v'
import { useFlyIn, useExpandWidth } from './animate'

const scope = ref(null)
const isInView = useInView(scope, {
    once: true,
    margin: '0px 0px -20% 0px'
} as Parameters<typeof useInView>[1])
const flyIn = useFlyIn(isInView)
const expand = useExpandWidth(isInView)

const benchmarks = [
    { name: 'Elysia', runtime: 'Bun', value: 118, display: '~118K', highlight: false },
    { name: 'Vafast', runtime: 'Bun', value: 101, display: '~101K', highlight: true },
    { name: 'Hono', runtime: 'Bun', value: 56, display: '~56K', highlight: false },
    { name: 'Express', runtime: 'Node', value: 56, display: '~56K', highlight: false }
]
</script>

<template>
    <section
        id="benchmark"
        class="relative max-w-5xl w-full mx-auto py-20 px-6"
        ref="scope"
    >
        <!-- 背景网格 -->
        <div class="grid-bg absolute inset-0 pointer-events-none">
            <div class="fog absolute inset-0" />
        </div>

        <div class="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <!-- 左侧数据展示 -->
            <div class="flex flex-col items-center lg:items-start gap-8">
                <div class="text-center lg:text-left">
                    <motion.div
                        class="text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500"
                        v-bind="flyIn(0.1)"
                    >
                        1.8x
                    </motion.div>
                    <motion.p
                        class="text-lg text-gray-500 dark:text-gray-400 mt-2"
                        v-bind="flyIn(0.2)"
                    >
                        比 Express 更快
                    </motion.p>
                </div>
                <div class="text-center lg:text-left">
                    <motion.div
                        class="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500"
                        v-bind="flyIn(0.3)"
                    >
                        101K
                    </motion.div>
                    <motion.p
                        class="text-lg text-gray-500 dark:text-gray-400 mt-2"
                        v-bind="flyIn(0.4)"
                    >
                        请求/秒
                    </motion.p>
                </div>
            </div>

            <!-- 右侧图表 -->
            <div class="flex-1 w-full max-w-xl">
                <ol class="flex flex-col gap-4">
                    <li
                        v-for="(item, index) in benchmarks"
                        :key="item.name"
                        class="flex items-center gap-4"
                    >
                        <motion.div
                            class="w-28 min-w-28 flex items-center gap-2"
                            v-bind="flyIn(0.3 + index * 0.1)"
                        >
                            <span
                                class="font-mono font-medium"
                                :class="
                                    item.highlight
                                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-sky-500 text-lg'
                                        : 'text-gray-600 dark:text-gray-300'
                                "
                            >
                                {{ item.name }}
                            </span>
                            <span class="text-xs text-gray-400">{{ item.runtime }}</span>
                        </motion.div>
                        <div class="flex-1 flex items-center gap-2">
                            <motion.div
                                v-bind="expand((item.value / 118) * 100, 0.4 + index * 0.1)"
                                class="h-8 rounded-full flex items-center justify-end pr-3"
                                :class="
                                    item.highlight
                                        ? 'bg-gradient-to-r from-sky-500 to-violet-500'
                                        : 'bg-gray-200 dark:bg-gray-700'
                                "
                            >
                                <span
                                    v-if="item.highlight"
                                    class="text-sm font-bold text-white font-mono"
                                >
                                    {{ item.display }}
                                </span>
                            </motion.div>
                            <span
                                v-if="!item.highlight"
                                class="text-sm font-mono text-gray-400"
                            >
                                {{ item.display }}
                            </span>
                        </div>
                    </li>
                </ol>
                <motion.p
                    class="text-sm text-gray-400 mt-6"
                    v-bind="flyIn(0.8)"
                >
                    测试环境：Bun 1.2.20, macOS, wrk (4线程, 100连接, 30s)
                </motion.p>
            </div>
        </div>
    </section>
</template>

<style scoped>
.grid-bg {
    background-color: transparent;
    background-image: linear-gradient(#e5e7eb 1px, transparent 1px),
        linear-gradient(to right, #e5e7eb 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.5;
}

html.dark .grid-bg {
    background-image: linear-gradient(#374151 1px, transparent 1px),
        linear-gradient(to right, #374151 1px, transparent 1px);
    opacity: 0.3;
}

.fog {
    background: radial-gradient(
        ellipse at center,
        transparent 0%,
        rgba(255, 255, 255, 1) 70%
    );
}

html.dark .fog {
    background: radial-gradient(
        ellipse at center,
        transparent 0%,
        rgb(17, 24, 39) 70%
    );
}
</style>
