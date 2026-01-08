<template>
    <article
        id="type-integrity"
        class="relative max-w-5xl w-full mx-auto mt-8 mb-12"
        ref="scope"
    >
        <div
            class="relative z-10 flex justify-between items-end w-full mb-7 fern-gap"
        >
            <h1
                class="flex flex-col flex-1 text-3xl sm:text-4xl sm:text-center text-gray-600 dark:text-gray-400 font-medium leading-[3rem] sm:leading-[4rem]"
            >
                <motion.span v-bind="flyIn()">更加先进的</motion.span>
                <motion.span
                    class="leading-[5rem] sm:leading-[5.5rem] text-6xl sm:text-7xl font-semibold text-gradient from-cyan-400 to-indigo-400 -translate-y-1"
                    v-bind="flyIn(0.1)"
                >
                    类型安全
                </motion.span>
            </h1>
        </div>
        <motion.section
            class="showcase flex flex-col justify-center relative mx-auto w-full h-[38rem] lg:rounded-xl my-4 px-4 bg-center bg-no-repeat"
            v-bind="flyIn(0.2)"
        >
            <motion.div
                layout
                class="window lg:max-w-3xl w-full mx-auto !bg-white/80 dark:!bg-gray-800/80 border-2 dark:border-gray-700 rounded-xl overflow-auto backdrop-blur-lg shadow-xl"
                v-bind="flyIn(0.3)"
                :transition="{
                    duration: 0.5,
                    ease: cubicBezier(0.16, 1, 0.3, 1)
                }"
            >
                <div class="control flex gap-2 pt-3 px-3">
                    <div class="control-dot" />
                    <div class="control-dot" />
                    <div class="control-dot" />
                </div>
                <motion.div class="body" v-if="form === 1" layoutId="code">
                    <slot name="type-1" />
                </motion.div>
                <motion.div class="body" v-else-if="form === 2" layoutId="code">
                    <slot name="type-2" />
                </motion.div>
                <motion.div class="body" v-else-if="form === 3" layoutId="code">
                    <slot name="type-3" />
                </motion.div>
                <motion.div class="body" v-else-if="form === 4" layoutId="code">
                    <slot name="type-4" />
                </motion.div>
            </motion.div>
        </motion.section>
        <section
            class="selector absolute z-10 flex justify-center items-center w-full md:min-h-12 -translate-y-16 md:-translate-y-10"
        >
            <form
                class="selector-form grid grid-cols-2 md:grid-cols-4 items-center justify-center gap-1 h-full px-1 py-1 mx-auto bg-white/75 dark:bg-gray-800/75 backdrop-blur-lg rounded-3xl border dark:border-gray-700 dark:border-t-gray-600 dark:border-l-gray-600"
            >
                <div
                    v-for="(label, index) in labels"
                    ref="active"
                    class="selector-item flex justify-center items-center min-h-10 h-full font-medium text-gray-500 dark:text-gray-300 rounded-full hover:text-blue-500 md:has-[:checked]:bg-transparent md:has-[:checked]:dark:bg-transparent has-[:checked]:bg-gray-400/20 has-[:checked]:dark:bg-white/15 transition-colors ease-out duration-200 cursor-pointer"
                >
                    <input
                        class="appearance-none w-0 h-0 hidden"
                        name="type-integrity"
                        :id="'type-integrity-' + (index + 1)"
                        type="radio"
                        :value="index + 1"
                        v-model.number="form"
                    />
                    <label
                        class="flex justify-center items-center text-center cursor-pointer px-6 md:px-4 w-full h-full"
                        :for="'type-integrity-' + (index + 1)"
                    >
                        {{ label }}
                    </label>
                </div>
            </form>
        </section>
        <section
            class="selector-active absolute z-10 flex justify-center items-center w-full md:min-h-12 -translate-y-16 md:-translate-y-10 pointer-events-none !hidden md:!flex"
        >
            <form
                class="active-form grid grid-cols-2 md:grid-cols-4 items-center justify-center gap-1 h-full px-1 py-0 my-1 mx-auto bg-blue-500 backdrop-blur-lg rounded-3xl border-blue-500"
                :style="{ 'clip-path': clipPath }"
            >
                <div
                    v-for="label in labels"
                    class="flex justify-center items-center min-h-10 h-full font-medium text-white rounded-full cursor-pointer"
                >
                    <label
                        class="flex justify-center items-center text-center cursor-pointer px-6 md:px-4 w-full h-full"
                    >
                        {{ label }}
                    </label>
                </div>
            </form>
        </section>
    </article>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'

import { useInView, motion, cubicBezier } from 'motion-v'
import { useFlyIn } from './animate'

const scope = ref(null)
const isInView = useInView(scope, {
    once: true,
    margin: '0px 0px -35% 0px'
} as Parameters<typeof useInView>[1])
const flyIn = useFlyIn(isInView)

const form = ref(0)
const clipPath = ref('inset(0px 75.233645% 0px 0.623053% round 25px)')

const activeElements = useTemplateRef<HTMLElement[]>('active')
const labels = ['路径参数', 'Schema 验证', '错误处理', '额外上下文']

watch(isInView, () => {
    if (isInView) {
        setTimeout(() => {
            form.value = 1
        }, 200)
    }
})

watch(form, (index) => {
    const active = activeElements.value?.[index - 1]

    if (!active) return

    const container = active.parentElement
    const total = container?.offsetWidth ?? 642
    const parentHeight = container?.offsetHeight ?? 50

    const { offsetLeft: left, offsetWidth } = active
    const right = left + offsetWidth

    const proximateLeft = 100 - (right / total) * 100
    const proximateRight = (left / total) * 100

    clipPath.value = `inset(0 ${proximateLeft}% 0 ${proximateRight}% round ${parentHeight / 2}px)`
})
</script>

<style scoped>
.showcase {
    background-image: url(/assets/sequoia.webp);
    background-size: cover;
}

.control-dot {
    border-radius: 9999px;
    background-color: rgb(156 163 175);
    border-width: 1px;
    width: 0.825rem;
    height: 0.825rem;
}

.control-dot:nth-child(1) {
    background-color: rgba(237, 106, 94);
    border: 0.5px solid rgba(195, 75, 70);
}

.control-dot:nth-child(2) {
    background-color: rgba(245, 191, 79);
    border: 0.5px solid rgba(203, 156, 78);
}

.control-dot:nth-child(3) {
    background-color: rgba(101, 192, 93);
    border: 0.5px solid rgba(82, 162, 74);
}

.body :deep(> div) {
    background: transparent !important;
}

.body :deep(> div > pre) {
    padding: 0.75rem !important;
}

.selector-form {
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.075);
}

html.dark .selector-form {
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
}

.active-form {
    will-change: clip-path;
    transition: clip-path 0.275s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
