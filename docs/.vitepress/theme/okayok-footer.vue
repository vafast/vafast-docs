<script setup lang="ts">
/**
 * Okayok 全家产品栏（产品 / Products）。
 * 数据源：Supabase superly 项目的 okayok_products（Table Editor 里编辑），
 * 构建时快照 okayok-family.json 兜底，浏览器端再拉一次最新数据（缓存 5 分钟）。
 * 见 ~/Documents/workspace/infra/okayok-shared/README.md
 */
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import { useLayout } from 'vitepress/theme-without-fonts'

import snapshot from './okayok-family.json'

interface Product {
    slug: string
    name: string
    name_zh: string | null
    url: string
    show_in_footer: boolean
}

const SUPABASE_URL = 'https://oacvulcjdoyyoelkalwq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_wxZiInZOk6lml3_EeNE8MA_2rQrzif4'
const CACHE_KEY = 'okayok-family:v1'
const CACHE_TTL_MS = 5 * 60 * 1000

const { lang } = useData()
const { hasSidebar } = useLayout()
const products = ref<Product[]>((snapshot as { products: Product[] }).products)

const isZh = computed(() => lang.value.startsWith('zh'))
const links = computed(() =>
    products.value
        .filter((p) => p.show_in_footer)
        .map((p) => ({
            label: isZh.value && p.name_zh ? p.name_zh : p.name,
            href: p.url
        }))
)

onMounted(async () => {
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (raw) {
            const { at, data } = JSON.parse(raw)
            if (Date.now() - at < CACHE_TTL_MS && data?.products?.length) {
                products.value = data.products
                return
            }
        }
    } catch {}
    try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 5000)
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/okayok_products?select=slug,name,name_zh,url,show_in_footer&is_visible=eq.true&order=sort_order.asc`,
            { headers: { apikey: SUPABASE_KEY }, signal: ctrl.signal }
        )
        clearTimeout(timer)
        if (!res.ok) return
        const rows = (await res.json()) as Product[]
        if (Array.isArray(rows) && rows.length) products.value = rows
    } catch {
        /* keep snapshot */
    }
})
</script>

<template>
    <footer class="okayok-footer" :class="{ 'has-sidebar': hasSidebar }">
        <div class="okayok-footer-inner">
            <div class="okayok-footer-col">
                <p class="okayok-footer-title">{{ isZh ? '产品' : 'Products' }}</p>
                <ul>
                    <li v-for="l in links" :key="l.href">
                        <a :href="l.href" target="_blank" rel="noopener noreferrer">{{ l.label }}</a>
                    </li>
                </ul>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.okayok-footer {
    border-top: 1px solid var(--vp-c-divider);
    padding: 32px 24px;
    background: var(--vp-c-bg);
    position: relative;
    z-index: 1;
}
@media (min-width: 960px) {
    .okayok-footer.has-sidebar {
        padding-left: calc(var(--vp-sidebar-width) + 32px);
    }
}
.okayok-footer-inner {
    max-width: 1152px;
    margin: 0 auto;
}
.okayok-footer-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--vp-c-text-1);
    margin: 0 0 12px;
}
.okayok-footer ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
}
.okayok-footer a {
    font-size: 14px;
    color: var(--vp-c-text-2);
    transition: color 0.2s;
}
.okayok-footer a:hover {
    color: var(--vp-c-text-1);
}
</style>
