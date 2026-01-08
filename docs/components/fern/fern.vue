<script setup lang="ts">
import Hero from './hero.vue'
import Features from './features.vue'
import Easy from './easy.vue'
import TypeIntegrity from './type-integrity.vue'
import E2E from './e2e.vue'
import Deploy from './deploy.vue'
import Benchmark from './benchmark.vue'
import Test from './test.vue'
import Sponsors from './sponsor.vue'
import Future from './future.vue'
import BuiltWithLove from './built-with-love.vue'
</script>

<template>
    <div id="landing" class="dark:bg-gray-900/60">
        <Hero />
        <article
            class="flex flex-col text-gray-500/80 dark:text-gray-400/90 leading-normal text-lg"
        >
            <!-- 核心特性 4 卡片 -->
            <Features />

            <!-- 性能对比 - 最吸引眼球的数据 -->
            <Benchmark />

            <!-- 设计以人为本 -->
            <Easy>
                <slot name="easy" />
            </Easy>

            <!-- 类型安全展示 -->
            <TypeIntegrity>
                <template v-slot:type-1>
                    <slot name="type-1" />
                </template>
                <template v-slot:type-2>
                    <slot name="type-2" />
                </template>
                <template v-slot:type-3>
                    <slot name="type-3" />
                </template>
                <template v-slot:type-4>
                    <slot name="type-4" />
                </template>
            </TypeIntegrity>

            <!-- 端到端类型同步 -->
            <E2E>
                <template v-slot:server>
                    <slot name="e2e-server" />
                </template>
                <template v-slot:client>
                    <slot name="e2e-client" />
                </template>
            </E2E>

            <!-- 测试展示 - 与类型安全形成连贯 -->
            <Test>
                <template v-slot:test-code>
                    <slot name="test-code" />
                </template>
                <template v-slot:test-script>
                    <slot name="test-script" />
                </template>
            </Test>

            <!-- 跨运行时部署 -->
            <Deploy />

            <!-- 社区/赞助 -->
            <Sponsors />

            <!-- CTA -->
            <Future />

            <!-- 页脚 -->
            <BuiltWithLove />
        </article>
    </div>
</template>

<style scoped>
#landing :deep(div[class*='language-'] > pre > code) {
    display: block;
    width: -moz-fit-content;
    width: fit-content;
    min-width: 100%;
    line-height: 1.5rem;
    font-size: var(--vp-code-font-size);
    color: var(--vp-code-block-color);
    transition: color 0.5s;
    font-size: 16px;
}

#landing :deep(div[class*='language-'] > pre) {
    position: relative;
    z-index: 1;
    padding: 1em;
    background: transparent;
    overflow-x: auto;
}

#landing :deep(div[class*='language-'] > span.lang),
#landing :deep(div[class*='language-'] > button) {
    display: none;
}

#landing :deep(div[class*='language-']) {
    border-radius: 8px;
    position: relative;
    overflow-x: auto;
    background-color: var(--vp-code-block-bg);
    transition: background-color 0.5s;
}

html.dark :deep(pre[class*='language-']) {
    background-color: rgb(30 41 59);
}

.token.operator,
.token.entity,
.token.url,
.language-css .token.string,
.style .token.string {
    background-color: transparent !important;
}
</style>
