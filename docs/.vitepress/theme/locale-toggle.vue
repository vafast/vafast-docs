<script setup lang="ts">
// 导航栏语言切换（仿 okayok.ai 的 LocaleSelector：图标按钮 + 下拉菜单，当前语言打勾）
// 菜单项为真实链接，映射到另一语言的同一页面（/quick-start.html <-> /en/quick-start.html）
// Navbar language switcher modelled on okayok.ai's LocaleSelector (icon trigger + dropdown with a check on
// the active locale). Items are real links to the counterpart page in each locale.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, withBase } from 'vitepress'

const { page, localeIndex } = useData()

/** 去掉语言前缀后的页面相对路径 / page path without the locale prefix */
const basePath = computed(() => page.value.relativePath.replace(/^en\//, ''))

/** 与 VitePress 未开启 cleanUrls 时的 URL 规则一致 / same URL rules as VitePress without cleanUrls */
const toUrl = (relativePath: string) =>
    withBase(
        '/' +
            relativePath
                .replace(/(^|\/)index\.md$/, '$1')
                .replace(/\.md$/, '.html')
    )

// 顺序与文案同 okayok.ai（English、中文）/ same order and labels as okayok.ai
const locales = computed(() => [
    { key: 'en', label: 'English', lang: 'en-US', href: toUrl(`en/${basePath.value}`) },
    { key: 'root', label: '中文', lang: 'zh-CN', href: toUrl(basePath.value) }
])

const triggerLabel = computed(() =>
    localeIndex.value === 'en' ? 'Language / 语言' : '语言 / Language'
)

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

const items = () =>
    Array.from(root.value?.querySelectorAll<HTMLAnchorElement>('.locale-menu-item') ?? [])

const focusItem = (index: number) => {
    const list = items()
    if (!list.length) return
    list[(index + list.length) % list.length].focus()
}

const openMenu = async (focus?: 'first' | 'active') => {
    open.value = true
    if (!focus) return
    await nextTick()
    const list = items()
    const activeIndex = list.findIndex((el) => el.dataset.active === 'true')
    focusItem(focus === 'active' && activeIndex >= 0 ? activeIndex : 0)
}

const closeMenu = (restoreFocus = false) => {
    open.value = false
    if (restoreFocus) trigger.value?.focus()
}

const onTriggerKeydown = (e: KeyboardEvent) => {
    if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
        openMenu('active')
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        openMenu('active')
    }
}

const onMenuKeydown = (e: KeyboardEvent) => {
    const list = items()
    const index = list.indexOf(document.activeElement as HTMLAnchorElement)
    if (e.key === 'ArrowDown') {
        e.preventDefault()
        focusItem(index + 1)
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        focusItem(index - 1)
    } else if (e.key === 'Home') {
        e.preventDefault()
        focusItem(0)
    } else if (e.key === 'End') {
        e.preventDefault()
        focusItem(list.length - 1)
    } else if (e.key === 'Tab') {
        closeMenu()
    }
}

const onDocumentKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open.value) closeMenu(true)
}

const onDocumentPointerdown = (e: Event) => {
    if (open.value && root.value && !root.value.contains(e.target as Node)) closeMenu()
}

// 路由切换后关闭菜单 / close after navigation
watch(() => page.value.relativePath, () => closeMenu())

onMounted(() => {
    document.addEventListener('pointerdown', onDocumentPointerdown)
    document.addEventListener('keydown', onDocumentKeydown)
})
onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onDocumentPointerdown)
    document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
    <div ref="root" class="locale-selector" :class="{ open }">
        <button
            ref="trigger"
            type="button"
            class="locale-trigger"
            aria-haspopup="menu"
            :aria-expanded="open ? 'true' : 'false'"
            aria-controls="locale-menu"
            :aria-label="triggerLabel"
            :title="triggerLabel"
            @click="open ? closeMenu() : openMenu()"
            @keydown="onTriggerKeydown"
        >
            <!-- lucide: languages -->
            <svg
                class="locale-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="m5 8 6 6" />
                <path d="m4 14 6-6 2-3" />
                <path d="M2 5h12" />
                <path d="M7 2h1" />
                <path d="m22 22-5-10-5 10" />
                <path d="M14 18h6" />
            </svg>
        </button>

        <Transition name="locale-menu">
            <div
                v-show="open"
                id="locale-menu"
                class="locale-menu"
                role="menu"
                :aria-label="triggerLabel"
                @keydown="onMenuKeydown"
            >
                <a
                    v-for="locale in locales"
                    :key="locale.key"
                    class="locale-menu-item"
                    role="menuitemradio"
                    :aria-checked="locale.key === localeIndex ? 'true' : 'false'"
                    :data-active="locale.key === localeIndex ? 'true' : 'false'"
                    :href="locale.href"
                    :hreflang="locale.lang"
                    :lang="locale.lang"
                    tabindex="-1"
                    @click="closeMenu()"
                >
                    <span>{{ locale.label }}</span>
                    <!-- lucide: check -->
                    <svg
                        v-if="locale.key === localeIndex"
                        class="locale-check"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                </a>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.locale-selector {
    display: none;
}

/* 外层 44px 胶囊与 tailwind.css 中其他导航胶囊对齐（h-11、rounded-full、bg-white/80、dark:bg-gray-900/70、blur） */
@media (min-width: 768px) {
    .locale-selector {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 44px;
        margin-left: 8px;
        padding: 0 6px;
        border-radius: 9999px;
        background: rgb(255 255 255 / 0.8);
        backdrop-filter: blur(16px);
    }

    .dark .locale-selector {
        background: rgb(17 24 39 / 0.7);
    }
}

/* okayok: size-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground */
.locale-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    color: var(--vp-c-text-2);
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
}

.locale-trigger:hover,
.locale-selector.open .locale-trigger {
    background: var(--vp-c-default-soft);
    color: var(--vp-c-text-1);
}

.locale-trigger:focus-visible {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 2px;
}

.locale-icon {
    width: 16px;
    height: 16px;
}

/* okayok: min-w-32 rounded-lg bg-popover p-1 shadow-md ring-1 ring-foreground/10, align="end" */
.locale-menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 100;
    min-width: 128px;
    padding: 4px;
    border-radius: 8px;
    background: var(--vp-c-bg-elv);
    color: var(--vp-c-text-1);
    box-shadow:
        0 4px 6px -1px rgb(0 0 0 / 0.1),
        0 2px 4px -2px rgb(0 0 0 / 0.1),
        0 0 0 1px var(--vp-c-divider);
    transform-origin: top right;
}

/* okayok item: flex justify-between gap-2 rounded-md px-2 py-2 text-sm focus:bg-accent */
.locale-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px;
    border-radius: 6px;
    color: var(--vp-c-text-1);
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    white-space: nowrap;
    outline: none;
    cursor: pointer;
    user-select: none;
}

.locale-menu-item:hover,
.locale-menu-item:focus-visible,
.locale-menu-item:focus {
    background: var(--vp-c-default-soft);
    color: var(--vp-c-text-1);
}

.locale-check {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}

/* okayok: fade-in-0 zoom-in-95, duration-100 */
.locale-menu-enter-active,
.locale-menu-leave-active {
    transition: opacity 0.1s ease, transform 0.1s ease;
}

.locale-menu-enter-from,
.locale-menu-leave-to {
    opacity: 0;
    transform: scale(0.95);
}
</style>
