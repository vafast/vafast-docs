<template>
    <section
        id="type-integrity"
        class="relative max-w-5xl w-full mx-auto py-20 px-6"
        ref="scope"
    >
        <!-- Title -->
        <div class="text-center mb-12">
            <motion.h2
                class="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100"
                v-bind="flyIn()"
            >
                {{ m.typeIntegrity.heading }}
            </motion.h2>
        </div>

        <!-- Code window -->
        <motion.div
            layout
            class="mx-auto w-full rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            v-bind="flyIn(0.2)"
            :transition="{
                duration: 0.5,
                ease: cubicBezier(0.16, 1, 0.3, 1)
            }"
        >
            <!-- Window control buttons -->
            <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div class="w-3 h-3 rounded-full bg-red-400" />
                <div class="w-3 h-3 rounded-full bg-yellow-400" />
                <div class="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <!-- Code content -->
            <div class="code-body">
                <div v-if="form === 1"><slot name="type-1" /></div>
                <div v-else-if="form === 2"><slot name="type-2" /></div>
                <div v-else-if="form === 3"><slot name="type-3" /></div>
                <div v-else-if="form === 4"><slot name="type-4" /></div>
            </div>
        </motion.div>

        <!-- Tabs -->
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
import { computed, ref, watch } from 'vue'
import { useInView, motion, cubicBezier } from 'motion-v'
import { useFlyIn } from './animate'
import { useI18n } from '../../.vitepress/i18n'

const { m } = useI18n()

const scope = ref(null)
const isInView = useInView(scope, {
    once: true,
    margin: '0px 0px -20% 0px'
} as Parameters<typeof useInView>[1])
const flyIn = useFlyIn(isInView)

const form = ref(0)
const labels = computed(() => m.value.typeIntegrity.labels)

// Select the first tab once in view
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
