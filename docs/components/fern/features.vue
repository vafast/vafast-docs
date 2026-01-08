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
    <article id="features" class="fern-gap" ref="scope">
        <div
            class="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-4 w-full mb-6 sm:mb-12"
        >
            <motion.h2
                class="text-5xl sm:text-6xl text-left text-gray-700 dark:text-gray-300 font-medium leading-[3.5rem] sm:leading-[4.5rem]"
                v-bind="flyIn()"
            >
                <span
                    class="text-gray-500 dark:text-gray-400 font-medium text-xl"
                >
                    核心特性
                </span>
                <br />
                为
                <span
                    class="text-gradient font-semibold from-purple-500 to-sky-400"
                >
                    开发者
                </span>
                <br />
                打造
            </motion.h2>
            <p
                class="w-full sm:w-1/2 lg:max-w-lg lg:w-full lg:pr-24 dark:text-gray-400 dark:font-medium"
                v-bind="flyIn(0.1)"
            >
                <motion.span class="inline-block mb-2" v-bind="flyIn(0.2)">
                    专注于开发者体验
                </motion.span>
                <br />
                <motion.span class="inline-block" v-bind="flyIn(0.3)">
                    Vafast 提供简洁的 API、强大的类型推断和内置的 Schema 验证，让你专注于业务逻辑。
                </motion.span>
            </p>
        </div>
        <div class="list">
            <motion.section v-bind="flyIn(0.2)">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon text-purple-400">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    高性能
                </h3>
                <h4 class="text-purple-400">比 Express 快 1.8x</h4>
                <p>JIT 编译验证器自动缓存</p>
                <p>Radix Tree O(k) 路由匹配</p>
            </motion.section>
            <motion.section v-bind="flyIn(0.3)">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon text-blue-400">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    类型安全
                </h3>
                <h4 class="text-blue-400">端到端类型推断</h4>
                <p>TypeBox Schema → TypeScript 类型</p>
                <p>跨文件类型不丢失</p>
            </motion.section>
            <motion.section v-bind="flyIn(0.4)">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon text-teal-400">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    声明式路由
                </h3>
                <h4 class="text-teal-400">结构即真相</h4>
                <p>路由是一个数组，一目了然</p>
                <p>中间件显式声明在路由上</p>
            </motion.section>
            <motion.section v-bind="flyIn(0.5)">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon text-orange-400">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    跨运行时
                </h3>
                <h4 class="text-orange-400">一套代码，任意环境</h4>
                <p>Node.js / Bun / Cloudflare Workers</p>
                <p>serve() 自动适配运行时</p>
            </motion.section>
            <motion.section v-bind="flyIn(0.6)">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon text-green-400">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    内置验证
                </h3>
                <h4 class="text-green-400">30+ Format 验证器</h4>
                <p>email, uuid, phone, url, date-time...</p>
                <p>导入即用，无需手动注册</p>
            </motion.section>
            <motion.section v-bind="flyIn(0.7)">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon text-pink-400">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    内置监控
                </h3>
                <h4 class="text-pink-400">零依赖性能监控</h4>
                <p>P50/P95/P99 百分位数</p>
                <p>RPS、状态码分布、内存监控</p>
            </motion.section>
        </div>
        <motion.h5
            class="text-right text-base mt-6 text-gray-400/75"
            v-bind="flyIn(0.5)"
        >
            这些是 Vafast 的核心价值，<br />
            让开发更简单、更高效。
        </motion.h5>
    </article>
</template>

<style>
@reference "../../tailwind.css";

#features {
    @apply relative max-w-5xl w-full mx-auto mt-4 mb-12;

    & > .list {
        @apply grid sm:grid-cols-2 lg:grid-cols-3 gap-4 z-10;

        & > section:nth-child(4),
        & > section:nth-child(5),
        & > section:nth-child(6) {
            @apply bg-white dark:bg-gray-900;
            background-image: radial-gradient(
                    closest-side at center,
                    rgba(255, 255, 255, 0.9) 70%,
                    transparent 150%
                ),
                radial-gradient(
                    at 20% 80%,
                    hsla(223, 100%, 65%, 0.12) 0px,
                    transparent 50%
                ),
                radial-gradient(
                    at 80% 20%,
                    hsla(280, 100%, 75%, 0.18) 0px,
                    transparent 50%
                ),
                radial-gradient(
                    at 50% 50%,
                    hsla(240, 100%, 87%, 0.25) 0px,
                    transparent 50%
                );

            html.dark & {
                background-image: radial-gradient(
                        closest-side at center,
                        var(--color-gray-800) 60%,
                        transparent 140%
                    ),
                    radial-gradient(
                        at 20% 80%,
                        hsla(223, 100%, 65%, 0.12) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 80% 20%,
                        hsla(280, 100%, 75%, 0.18) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 50% 50%,
                        hsla(240, 100%, 87%, 0.25) 0px,
                        transparent 50%
                    );
            }
        }

        & > section {
            @apply relative flex flex-col w-full rounded-3xl p-6 border border-r-blue-100 border-b-purple-100 border-t-purple-200 border-l-blue-200 dark:border-r-blue-300/40 dark:border-b-purple-300/40 dark:border-t-purple-400/50 dark:border-l-blue-400/40 transform hover:-translate-y-2 transition-all ease-out duration-200 dark:text-gray-400;
            box-shadow: 0 7px 40px rgba(48, 160, 255, 0.075);

            &:hover {
                box-shadow: 0 12px 55px rgba(223, 160, 255, 0.2);
            }

            html.dark & {
                box-shadow: 0 7px 40px rgba(48, 160, 255, 0.15);

                &:hover {
                    box-shadow: 0 12px 55px rgba(223, 160, 255, 0.25);
                }
            }

            & > h3 {
                @apply flex items-center gap-2 text-2xl font-medium text-gray-700 dark:text-gray-300;

                & > .icon {
                    @apply w-6 h-6 flex-shrink-0;
                }
            }

            & > h4 {
                @apply inline-block text-base font-medium mt-0.5 mb-3 dark:text-gray-400/90;
            }

            &:nth-child(1) {
                @apply bg-white dark:bg-gray-900;
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

                html.dark & {
                    background-image: radial-gradient(
                            closest-side at center,
                            var(--color-gray-800) 70%,
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
            }

            &:nth-child(2) {
                @apply bg-white dark:bg-gray-900;
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
                        at 7% 95%,
                        hsla(223, 100%, 65%, 0.14) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 89% 10%,
                        hsla(210, 100%, 69%, 0.29) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 30% 0%,
                        hsla(240, 100%, 87%, 0.35) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 100% 54%,
                        hsla(280, 100%, 75%, 0.26) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 61% 0%,
                        hsla(22, 100%, 77%, 0.19) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 2% 48%,
                        hsla(240, 100%, 70%, 0.15) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 80% 100%,
                        hsla(343, 100%, 76%, 0.17) 0px,
                        transparent 50%
                    );

                html.dark & {
                    background-image: radial-gradient(
                            closest-side at center,
                            var(--color-gray-800) 70%,
                            transparent 150%
                        ),
                        radial-gradient(
                            at 7% 95%,
                            hsla(223, 100%, 65%, 0.14) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 89% 10%,
                            hsla(210, 100%, 69%, 0.29) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 30% 0%,
                            hsla(240, 100%, 87%, 0.35) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 100% 54%,
                            hsla(280, 100%, 75%, 0.26) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 61% 0%,
                            hsla(22, 100%, 77%, 0.19) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 2% 48%,
                            hsla(240, 100%, 70%, 0.15) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 80% 100%,
                            hsla(343, 100%, 76%, 0.17) 0px,
                            transparent 50%
                        );
                }
            }

            &:nth-child(3) {
                @apply bg-white dark:bg-gray-900;
                background-image: radial-gradient(
                        closest-side at center,
                        rgba(255, 255, 255, 0.8) 70%,
                        transparent 150%
                    ),
                    radial-gradient(
                        closest-side at center,
                        rgba(255, 255, 255, 0.8) 90%,
                        transparent 150%
                    ),
                    radial-gradient(
                        at 29% 66%,
                        hsla(223, 100%, 65%, 0.14) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 47% 51%,
                        hsla(210, 100%, 69%, 0.29) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 34% 34%,
                        hsla(240, 100%, 87%, 0.35) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 74% 32%,
                        hsla(280, 100%, 75%, 0.26) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 57% 66%,
                        hsla(22, 100%, 77%, 0.19) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 42% 84%,
                        hsla(240, 100%, 70%, 0.15) 0px,
                        transparent 50%
                    ),
                    radial-gradient(
                        at 59% 10%,
                        hsla(343, 100%, 76%, 0.17) 0px,
                        transparent 50%
                    );

                html.dark & {
                    background-image: radial-gradient(
                            closest-side at center,
                            var(--color-gray-800) 50%,
                            transparent 120%
                        ),
                        radial-gradient(
                            at 29% 66%,
                            hsla(223, 100%, 65%, 0.14) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 47% 51%,
                            hsla(210, 100%, 69%, 0.29) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 34% 34%,
                            hsla(240, 100%, 87%, 0.35) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 74% 32%,
                            hsla(280, 100%, 75%, 0.26) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 57% 66%,
                            hsla(22, 100%, 77%, 0.19) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 42% 84%,
                            hsla(240, 100%, 70%, 0.15) 0px,
                            transparent 50%
                        ),
                        radial-gradient(
                            at 59% 10%,
                            hsla(343, 100%, 76%, 0.17) 0px,
                            transparent 50%
                        );
                }
            }
        }
    }
}
</style>
