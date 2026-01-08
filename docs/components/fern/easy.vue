<script setup lang="ts">
import { ref } from 'vue'
import { useInView, motion } from 'motion-v'
import { useFlyIn } from './animate'

const scope = ref(null)
const isInView = useInView(scope, {
    once: true,
    margin: '0px 0px -35% 0px'
})
const flyIn = useFlyIn(isInView)
</script>

<template>
    <article
        id="made-for-human"
        class="fern-gap flex flex-col max-w-5xl w-full mx-auto gap-8 my-16"
        ref="scope"
    >
        <div
            class="flex flex-col md:flex-row justify-between items-center gap-8 w-full mb-6"
        >
            <header class="flex flex-col flex-1 text-xl gap-6">
                <div class="flex flex-col gap-3 mb-2">
                    <motion.h3
                        class="text-2xl font-medium text-700"
                        v-bind="flyIn()"
                    >
                        我们的原则
                    </motion.h3>
                    <motion.h2
                        class="text-6xl font-semibold text-gradient from-sky-500 to-violet-500 leading-[4.25rem]"
                        v-bind="flyIn(0.1)"
                    >
                        设计以人为本
                    </motion.h2>
                </div>
                <motion.p class="max-w-md leading-normal" v-bind="flyIn(0.2)">
                    我们的目标是设计一个符合人体工程学、合理且高效的工作框架，即使是初学者也能轻松使用。
                </motion.p>
                <motion.p class="max-w-md leading-normal" v-bind="flyIn(0.3)">
                    设计以避免不必要的复杂性，并为您简化类型复杂性，以便您专注于构建。
                </motion.p>
                <motion.p class="leading-normal" v-bind="flyIn(0.4)">
                    一个感觉就像
                    <span
                        class="text-gradient from-violet-500 to-sky-500 font-semibold"
                    >
                        JavaScript 的框架
                    </span>
                </motion.p>
            </header>
            <motion.section
                class="showcase flex flex-col flex-1 max-w-full sm:max-w-[30rem] rounded-2xl overflow-hidden border dark:border-gray-700 bg-white dark:bg-gray-800"
                v-bind="flyIn(0.3)"
            >
                <slot />
            </motion.section>
        </div>

        <footer class="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            <motion.article
                class="flex flex-col flex-1 text-sm"
                v-bind="flyIn(0.6)"
            >
                <h4 class="flex items-center gap-1.5 text-xl mb-2">
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
                        class="feather feather-box scale-90"
                    >
                        <path
                            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                        ></path>
                        <polyline
                            points="3.27 6.96 12 12.01 20.73 6.96"
                        ></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    自动响应
                </h4>
                <p>返回对象自动转 JSON</p>
                <p>返回字符串自动 text/plain</p>
            </motion.article>
            <motion.article
                class="flex flex-col flex-1 text-sm"
                v-bind="flyIn(0.7)"
            >
                <h4 class="flex items-center gap-1.5 text-xl mb-2">
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
                        class="feather feather-alert-circle scale-90"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    语义化错误
                </h4>
                <p>
                    <span class="font-mono text-violet-500 font-bold"
                        >err.notFound()</span
                    >
                </p>
                <p>统一的错误响应格式</p>
            </motion.article>
            <motion.article
                class="flex flex-col flex-1 text-sm"
                v-bind="flyIn(0.8)"
            >
                <h4 class="flex items-center gap-1.5 text-xl mb-2">
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
                        class="feather feather-list scale-90"
                    >
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    声明式路由
                </h4>
                <p>路由是一个数组</p>
                <p>一眼看清所有 API 端点</p>
            </motion.article>
            <motion.article
                class="flex flex-col flex-1 text-sm"
                v-bind="flyIn(0.9)"
            >
                <h4 class="flex items-center gap-1.5 text-xl mb-2">
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
                        class="feather feather-globe scale-90"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path
                            d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                        ></path>
                    </svg>
                    跨运行时
                </h4>
                <p>Node.js / Bun / Workers</p>
                <p>同一套代码，任意运行时</p>
            </motion.article>
        </footer>
    </article>
</template>

<style scoped>
.showcase {
    box-shadow: 0 16px 40px rgba(0, 123, 255, 0.075);
    background-image: radial-gradient(
            closest-side at center,
            rgba(255, 255, 255, 1) 70%,
            transparent 150%
        ),
        radial-gradient(
            closest-side at center,
            rgba(255, 255, 255, 1) 90%,
            transparent 150%
        ),
        radial-gradient(
            at 9% 67%,
            hsla(223, 100%, 65%, 0.14) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 22% 0%,
            hsla(210, 100%, 69%, 0.29) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 97% 49%,
            hsla(240, 100%, 87%, 0.35) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 100% 75%,
            hsla(280, 100%, 75%, 0.26) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 75% 100%,
            hsla(22, 100%, 77%, 0.19) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 40% 100%,
            hsla(240, 100%, 70%, 0.15) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 72% 0%,
            hsla(343, 100%, 76%, 0.17) 0px,
            transparent 50%
        );
}

html.dark .showcase {
    box-shadow: 0 16px 40px rgba(0, 123, 255, 0.15);
    background-image: radial-gradient(
            closest-side at center,
            var(--color-gray-800) 35%,
            transparent 140%
        ),
        radial-gradient(
            at 9% 67%,
            hsla(223, 100%, 65%, 0.14) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 22% 0%,
            hsla(210, 100%, 69%, 0.29) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 97% 49%,
            hsla(240, 100%, 87%, 0.35) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 100% 75%,
            hsla(280, 100%, 75%, 0.26) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 75% 100%,
            hsla(22, 100%, 77%, 0.19) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 40% 100%,
            hsla(240, 100%, 70%, 0.15) 0px,
            transparent 50%
        ),
        radial-gradient(
            at 72% 0%,
            hsla(343, 100%, 76%, 0.17) 0px,
            transparent 50%
        );
}

.showcase :deep(> div) {
    background: transparent !important;
}

.showcase :deep(> div > pre) {
    padding-top: 0.875rem !important;
    padding-bottom: 0.875rem !important;
}
</style>
