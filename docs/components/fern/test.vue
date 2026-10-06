<script setup lang="ts">
import { ref } from 'vue'
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
</script>

<template>
    <section
        id="test-with-confidence"
        class="relative max-w-5xl w-full mx-auto py-20 px-6"
        ref="scope"
    >
        <div class="flex flex-col items-center gap-10">
            <!-- Top copy -->
            <div class="text-center max-w-2xl">
                <motion.h2
                    class="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-gray-100"
                    v-bind="flyIn()"
                >
                    {{ m.test.heading }}
                </motion.h2>
                <motion.p
                    class="text-gray-500 dark:text-gray-400 leading-relaxed"
                    v-bind="flyIn(0.1)"
                    v-html="m.test.descriptionHtml"
                />
            </div>

            <!-- Code showcase -->
            <motion.div
                class="w-full"
                v-bind="flyIn(0.4)"
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
