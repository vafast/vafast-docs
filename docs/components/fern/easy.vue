<script setup lang="ts">
import { computed, ref } from 'vue'
import { useInView, motion } from 'motion-v'
import { useFlyIn } from './animate'
import { useI18n } from '../../.vitepress/i18n'

const { m } = useI18n()

const scope = ref(null)
const isInView = useInView(scope, {
    once: true,
    margin: '0px 0px -20% 0px'
} as Parameters<typeof useInView>[1])
const flyIn = useFlyIn(isInView)

const icons = [
    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01',
    'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'
]
const principles = computed(() =>
    m.value.easy.principles.map((p, i) => ({ icon: icons[i], ...p }))
)
</script>

<template>
    <section
        id="made-for-human"
        class="relative max-w-5xl w-full mx-auto py-20 px-6"
        ref="scope"
    >
        <div class="flex flex-col gap-10 items-center">
            <!-- Top copy -->
            <div class="text-center max-w-2xl">
                <motion.h2
                    class="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-gray-100"
                    v-bind="flyIn()"
                >
                    {{ m.easy.heading }}
                </motion.h2>
                <motion.p
                    class="text-gray-500 dark:text-gray-400 leading-relaxed"
                    v-bind="flyIn(0.1)"
                >
                    {{ m.easy.description }}
                </motion.p>
            </div>

            <!-- Code showcase -->
            <motion.div
                class="w-full"
                v-bind="flyIn(0.3)"
            >
                <div
                    class="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                    <!-- Window control buttons -->
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

        <!-- Bottom feature grid -->
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
                <h3
                    class="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1"
                >
                    {{ item.title }}
                </h3>
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
