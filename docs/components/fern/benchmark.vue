<script setup lang="ts">
import { ref } from 'vue'
import { useInView, motion } from 'motion-v'
import { useFlyIn, useFadeIn, useExpandWidth } from './animate'

const scope = ref(null)
const isInView = useInView(scope, {
    once: true,
    margin: '0px 0px -35% 0px'
} as Parameters<typeof useInView>[1])
const flyIn = useFlyIn(isInView)
const fadeIn = useFadeIn(isInView)
const expand = useExpandWidth(isInView)
</script>

<template>
    <article
        id="benchmark"
        class="relative flex flex-col md:flex-row items-center gap-12 md:gap-24 max-w-5xl w-full my-4 py-12 px-6 mx-auto"
        ref="scope"
    >
        <motion.div
            class="grid-bg absolute top-0 left-0 w-full h-full pointer-events-none"
            v-bind="fadeIn(0.5)"
        >
            <div class="fog w-full h-full" />
        </motion.div>
        <header
            class="flex flex-row md:flex-col justify-around md:justify-center z-10 w-full md:max-w-[10.5rem]"
        >
            <div
                class="flex flex-col justify-start items-start gap-0.5 text-gray-400 md:mb-10"
            >
                <motion.h3
                    class="text-7xl sm:text-8xl font-bold text-gradient from-pink-400 to-fuchsia-400"
                    v-bind="flyIn(0.1)"
                >
                    1.8x
                </motion.h3>
                <motion.p class="text-lg sm:text-xl" v-bind="flyIn(0.2)"
                    >比 Express 更快</motion.p
                >
            </div>

            <div
                class="flex flex-col justify-start items-start gap-0.5 text-gray-400"
            >
                <motion.h3
                    class="text-7xl sm:text-8xl md:!text-7xl font-bold text-gradient from-violet-400 to-pink-400"
                    v-bind="flyIn(0.3)"
                >
                    101K
                </motion.h3>
                <motion.p class="text-lg sm:text-xl" v-bind="flyIn(0.4)"
                    >请求/秒</motion.p
                >
            </div>
        </header>
        <div class="z-10 flex flex-col flex-1 gap-4">
            <ol class="flex flex-col flex-1 gap-4">
                <li class="flex justify-start items-center gap-4 w-full h-6">
                    <motion.h6
                        class="w-36 min-w-36 font-mono text-lg font-medium text-gray-500 dark:text-gray-400"
                        v-bind="flyIn(0.3)"
                    >
                        Elysia
                        <span class="text-sm text-gray-400 font-normal"
                            >Bun</span
                        >
                    </motion.h6>
                    <motion.div
                        v-bind="expand(100, 0.4)"
                        class="bar-item flex justify-end items-center w-full h-6 font-bold font-mono text-sm pr-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-400 !text-white"
                    >
                        <span>~118K reqs/s</span>
                    </motion.div>
                </li>
                <li class="flex justify-start items-center gap-4 w-full h-6">
                    <motion.h6
                        class="w-36 min-w-36 font-mono text-lg font-medium text-gray-500 dark:text-gray-400"
                        v-bind="flyIn(0.4)"
                    >
                        <span
                            class="!text-xl !font-semibold !ml-0 text-gradient from-violet-500 to-sky-500"
                        >
                            Vafast
                        </span>
                        <span class="text-sm text-gray-400 font-normal">
                            Bun</span
                        >
                    </motion.h6>
                    <motion.div
                        v-bind="expand(86, 0.5)"
                        class="bar-item flex justify-end items-center w-full h-6 font-bold font-mono text-sm pr-3 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-400 !text-white"
                    >
                        <span>~101K</span>
                    </motion.div>
                </li>
                <li class="flex justify-start items-center gap-4 w-full h-6">
                    <motion.h6
                        class="w-36 min-w-36 font-mono text-lg font-medium text-gray-500 dark:text-gray-400"
                        v-bind="flyIn(0.5)"
                    >
                        Hono
                        <span class="text-sm text-gray-400 font-normal"
                            >Bun</span
                        >
                    </motion.h6>
                    <motion.div
                        v-bind="expand(47, 0.6)"
                        class="bar-item flex justify-end items-center w-full h-6 font-bold font-mono text-gray-500 dark:text-gray-400 text-sm pr-3 bg-gray-200 dark:bg-gray-600 rounded-2xl"
                    />
                    <motion.p
                        class="font-medium font-mono text-gray-400 text-sm -translate-x-2"
                        v-bind="flyIn(0.7)"
                        >~56K</motion.p
                    >
                </li>
                <li class="flex justify-start items-center gap-4 w-full h-6">
                    <motion.h6
                        class="w-36 min-w-36 font-mono text-lg font-medium text-gray-500 dark:text-gray-400"
                        v-bind="flyIn(0.6)"
                    >
                        Express
                        <span class="text-sm text-gray-400 font-normal"
                            >Node</span
                        >
                    </motion.h6>
                    <motion.div
                        v-bind="expand(48, 0.7)"
                        class="bar-item flex justify-end items-center w-full h-6 font-bold font-mono text-gray-500 dark:text-gray-400 text-sm pr-3 bg-gray-200 dark:bg-gray-600 rounded-2xl"
                    />
                    <motion.p
                        class="font-medium font-mono text-gray-400 text-sm -translate-x-2"
                        v-bind="flyIn(0.8)"
                        >~56K</motion.p
                    >
                </li>
            </ol>
            <motion.p class="text-sm mt-3 text-gray-400" v-bind="flyIn(0.9)">
                以每秒请求次数进行测量。测试环境：Bun 1.2.20, macOS, wrk 基准测试
                (4线程, 100连接, 30s)
            </motion.p>
        </div>
    </article>
</template>

<style scoped>
.fog {
    background-image: radial-gradient(
        closest-side at center,
        transparent 0%,
        rgba(255, 255, 255, 1) 100%
    );
}

html.dark .fog {
    background-image: radial-gradient(
        closest-side at center,
        transparent 0%,
        var(--color-gray-900) 100%
    );
}

.grid-bg {
    background-color: transparent;
    background-image: linear-gradient(#ddd 1px, transparent 1px),
        linear-gradient(to right, #ddd 1px, transparent 1px);
    background-size: 40px 40px;
}

html.dark .grid-bg {
    background-image: linear-gradient(#646464 1px, transparent 1px),
        linear-gradient(to right, #646464 1px, transparent 1px);
}
</style>
