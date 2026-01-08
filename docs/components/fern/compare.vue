<template>
    <section class="code-compare z-40 grid grid-cols-1 lg:grid-cols-2 gap-2.5 rounded-xl w-full">
        <article class="flex flex-col gap-4 *:!m-0">
            <section class="compare-section flex flex-1 *:w-full rounded-xl">
                <slot name="left" />
            </section>
            <slot name="left-content" />
        </article>
        <article class="flex flex-col gap-4 *:!m-0">
            <section class="compare-section flex flex-1 *:w-full rounded-xl">
                <slot name="right" />
            </section>
            <slot name="right-content" />
        </article>
    </section>
</template>

<style scoped>
.code-compare {
    grid-auto-rows: 1fr;
}

.compare-section :deep(.vp-code-group > .blocks) {
    height: 100%;
}

.compare-section :deep(.vp-code-group > .blocks > div) {
    margin: 0;
    height: calc(100% - 50px);
}

@media (max-width: 640px) {
    .compare-section :deep(.vp-code-group > .blocks > div) {
        margin: 0 -24px;
    }
}

.compare-section :deep(.vp-code-group > .blocks > div > pre) {
    height: 100%;
    overflow-y: hidden;
}
</style>
