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

const features = [
    {
        icon: 'zap',
        title: '极致性能',
        subtitle: '比 Express 快 1.8x',
        color: 'violet',
        description: 'JIT 编译验证器 · Radix Tree 路由'
    },
    {
        icon: 'shield',
        title: '类型安全',
        subtitle: '端到端类型推断',
        color: 'sky',
        description: 'Schema → Type · 跨文件类型'
    },
    {
        icon: 'list',
        title: '声明式路由',
        subtitle: '结构即真相',
        color: 'teal',
        description: '路由即数组 · 显式中间件'
    },
    {
        icon: 'globe',
        title: '跨运行时',
        subtitle: '一套代码，任意环境',
        color: 'orange',
        description: 'Node.js · Bun · Cloudflare Workers'
    }
]

const iconMap: Record<string, string> = {
    zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'
}

const colorMap: Record<string, { icon: string; subtitle: string; bg: string }> =
    {
        violet: {
            icon: 'text-violet-500',
            subtitle: 'text-violet-400',
            bg: 'bg-violet-500/10'
        },
        sky: {
            icon: 'text-sky-500',
            subtitle: 'text-sky-400',
            bg: 'bg-sky-500/10'
        },
        teal: {
            icon: 'text-teal-500',
            subtitle: 'text-teal-400',
            bg: 'bg-teal-500/10'
        },
        orange: {
            icon: 'text-orange-500',
            subtitle: 'text-orange-400',
            bg: 'bg-orange-500/10'
        }
    }
</script>

<template>
    <section
        id="features"
        class="relative max-w-5xl w-full mx-auto py-20 px-6"
        ref="scope"
    >
        <!-- 标题 -->
        <div class="text-center mb-16">
            <motion.h2
                class="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4"
                v-bind="flyIn()"
            >
                核心特性
            </motion.h2>
            <motion.p
                class="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
                v-bind="flyIn(0.1)"
            >
                简洁的 API、强大的类型推断、内置验证，专为高效开发设计
            </motion.p>
        </div>

        <!-- 4 卡片网格 -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.article
                v-for="(feature, index) in features"
                :key="feature.title"
                class="feature-card group relative flex flex-col p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                v-bind="flyIn(0.1 + index * 0.1)"
            >
                <!-- 图标 -->
                <div
                    class="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    :class="colorMap[feature.color].bg"
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
                        :class="colorMap[feature.color].icon"
                    >
                        <path :d="iconMap[feature.icon]" />
                    </svg>
                </div>

                <!-- 标题 -->
                <h3
                    class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1"
                >
                    {{ feature.title }}
                </h3>

                <!-- 副标题 -->
                <p class="text-sm font-medium mb-3" :class="colorMap[feature.color].subtitle">
                    {{ feature.subtitle }}
                </p>

                <!-- 描述 -->
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ feature.description }}
                </p>
            </motion.article>
        </div>
    </section>
</template>

<style scoped>
.feature-card {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

.feature-card:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

html.dark .feature-card {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

html.dark .feature-card:hover {
    box-shadow: 0 12px 40px rgba(100, 100, 255, 0.1);
}
</style>
