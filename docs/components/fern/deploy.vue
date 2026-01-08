<template>
    <section
        class="flex flex-col-reverse lg:flex-row justify-center items-center gap-16 md:gap-8 lg:gap-20 max-w-5xl w-full px-6 py-20 mx-auto"
        ref="scope"
    >
        <!-- 左侧圆形图标阵列 -->
        <div
            class="relative flex justify-center items-center size-72 sm:size-96 md:size-128"
        >
            <div class="relative flex justify-center items-center overflow-hidden lg:overflow-visible size-72 sm:size-96 md:size-128">
                <motion.div v-bind="fadeIn()" class="absolute size-36 rotate-45 border-t border-l border-b border-gray-300 dark:border-gray-700 rounded-full" />
                <motion.div v-bind="fadeIn()" class="absolute size-52 border-t border-l border-gray-200 dark:border-gray-700 rounded-full" />
                <motion.div v-bind="fadeIn()" class="absolute size-68 rotate-45 border-l border-gray-200 dark:border-gray-700 rounded-full" />
                <motion.div v-bind="fadeIn()" class="absolute size-84 rotate-45 border-r border-gray-200 dark:border-gray-700 rounded-full" />
                <motion.div v-bind="fadeIn()" class="absolute size-52 rotate-45 border-r border-gray-200 dark:border-gray-700 rounded-full" />

                <motion.div v-bind="fadeIn()" class="hidden lg:block absolute size-164 rotate-45 border-l border-gray-200 dark:border-gray-700 rounded-full" />
                <motion.div v-bind="fadeIn()" class="hidden lg:block absolute size-148 border-l border-t border-gray-200 dark:border-gray-700 rounded-full" />
            </div>

            <!-- 中心 Vafast Logo -->
            <motion.img
                v-bind="fadeIn()"
                :src="asset('assets/vafast.svg')"
                class="absolute z-10 size-20 sm:size-24"
            />

            <!-- 周围的运行时 Logo -->
            <template v-for="(item, index) in items" :key="index">
                <motion.img
                    v-if="typeof item === 'string'"
                    v-bind="fadeIn(index * 0.05)"
                    :src="`/logo/${item}`"
                    class="circle-item"
                    :style="{
                        '--angle': (360 / items.length) * index - 90 + 'deg'
                    }"
                />
                <template v-else>
                    <motion.img
                        v-bind="fadeIn(index * 0.05)"
                        :src="`/logo/${item[0]}`"
                        class="circle-item dark:hidden"
                        :style="{
                            '--angle': (360 / items.length) * index - 90 + 'deg'
                        }"
                    />
                    <motion.img
                        v-bind="fadeIn(index * 0.05)"
                        :src="`/logo/${item[1]}`"
                        class="circle-item hidden dark:block"
                        :style="{
                            '--angle': (360 / items.length) * index - 90 + 'deg'
                        }"
                    />
                </template>
            </template>
        </div>

        <!-- 右侧文案 -->
        <div class="text-xl max-w-md">
            <motion.p
                class="text-sm font-medium text-violet-500 mb-2"
                v-bind="flyIn()"
            >
                跨平台部署
            </motion.p>
            <motion.h2
                class="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-gray-100"
                v-bind="flyIn(0.1)"
            >
                一套代码，到处运行
            </motion.h2>
            <motion.p class="text-gray-500 dark:text-gray-400 text-base leading-relaxed" v-bind="flyIn(0.2)">
                基于 Web 标准 Fetch API 构建，不绑定任何运行时。同一份代码可以部署到 Node.js、Bun、Cloudflare Workers 等任意平台。
            </motion.p>
            <motion.div class="flex flex-wrap gap-2 mt-8" v-bind="flyIn(0.3)">
                <span class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">Node.js</span>
                <span class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">Bun</span>
                <span class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">Deno</span>
                <span class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">Workers</span>
                <span class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">Vercel</span>
                <span class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">Netlify</span>
            </motion.div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useInView, motion } from 'motion-v'
import { useData } from 'vitepress'
import { useFadeIn, useFlyIn } from './animate'

const { site } = useData()
const asset = (path: string) => {
    const base = site.value.base
    const normalized = path.startsWith('/') ? path.slice(1) : path
    return `${base}${normalized}`
}

const scope = ref(null)
const isInView = useInView(scope, {
    once: true,
    margin: '0px 0px -20% 0px'
} as Parameters<typeof useInView>[1])
const flyIn = useFlyIn(isInView)
const fadeIn = useFadeIn(isInView)

// 运行时/平台 Logo 列表
const items = [
    'bun.svg',
    ['deno-light.svg', 'deno-dark.svg'],
    ['vercel-light.svg', 'vercel-dark.svg'],
    ['railway-light.svg', 'railway-dark.svg'],
    'svelte.svg',
    ['expo-light.svg', 'expo-dark.svg'],
    'next-dark.svg',
    'tanstack.svg',
    'nuxt.svg',
    'netlify.svg',
    'cloudflare-workers.svg',
    'nodejs.svg'
] as const
</script>

<style scoped>
.circle-item {
    --radius: 9rem;
    position: absolute;
    z-index: 10;
    width: 2.75rem;
    height: 2.75rem;
    transform: rotate(var(--angle)) translate(var(--radius)) rotate(calc(var(--angle) * -1));
    transform-origin: 0 0;
}

@media (min-width: 640px) {
    .circle-item {
        --radius: 12rem;
        width: 3rem;
        height: 3rem;
    }
}

@media (min-width: 768px) {
    .circle-item {
        --radius: 14rem;
    }
}
</style>
