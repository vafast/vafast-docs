<template>
    <footer
        class="flex flex-col justify-center items-center gap-2 text-sm text-gray-400 dark:text-gray-400 mt-8 mb-6"
    >
        <p>
            <a target="_blank" href="https://github.com/vafast/vafast">
                Vafast
            </a>
            - 用 ❤️ 构建的高性能 TypeScript Web 框架
        </p>
    </footer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const isToggle = ref(false)
</script>

<style>
.-collpasable {
    transition: height 0.375s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
