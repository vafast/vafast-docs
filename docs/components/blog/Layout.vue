<template>
    <article id="blog" class="blog-article flex flex-col max-w-3xl w-full mx-auto mt-8 text-lg">
        <h1 class="blog-title !text-3xl md:!text-4xl font-semibold">
            {{ props.title }}
        </h1>
        <aside class="flex gap-2 items-center mt-3">
            <img
                class="w-9 h-9 rounded-full"
                :src="profile"
                :alt="props.author"
            />
            <div class="flex flex-col justify-start">
                <h3 class="!text-sm !m-0 opacity-75">{{ props.author }}</h3>
                <p
                    class="flex flex-row items-center gap-2 !text-xs !m-0 opacity-75"
                >
                    <span>{{ props.date }}</span>
                    <span>ー</span>
                    <a :href="twitter" target="_blank">@{{ author.twitter }}</a>
                </p>
            </div>
        </aside>
        <img
            :src="props.src"
            :alt="props.alt"
            class="blog-img w-full mt-5 mb-2 rounded-2xl"
            :class="props.shadow ? 'shadow-xl shadow-black/7.5' : 'border'"
        />
        <main id="blog-content">
            <slot />
        </main>
    </article>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue'

const authors = {
    vafast: {
        src: 'aris.webp',
        twitter: 'vafast_dev'
    }
}

type Authors = typeof authors

const props = defineProps<{
    title: string
    src: string
    alt: string
    author: keyof Authors
    date: string
    shadow?: boolean
}>()

const author = authors[props.author]
const profile = `/blog/authors/${author.src}`
const twitter = `https://twitter.com/${author.twitter}`

const mutated = ['.aside', '.content', '.content-container', '.VPDocFooter']
onMounted(() => {
    mutated.forEach((selector) => {
        document.querySelector(selector)?.classList.add('blog')
    })
})

onUnmounted(() => {
    mutated.forEach((selector) => {
        document.querySelector(selector)?.classList.remove('blog')
    })
})
</script>

<style scoped>
.blog-title {
    line-height: 3.25rem !important;
}

#blog-content :deep(video),
#blog-content :deep(img) {
    border-radius: 0.75rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
}

.-png {
    box-shadow: unset !important;
    background: transparent !important;
}
</style>

<style>
.blog.aside {
    position: fixed !important;
    z-index: 10;
    left: calc(50% + 48rem / 2 + 2rem) !important;
}

.blog.content,
.blog.content-container {
    max-width: unset !important;
}

.blog.VPDocFooter {
    display: none !important;
}
</style>
