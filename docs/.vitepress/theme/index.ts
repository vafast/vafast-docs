import { toRefs } from 'vue'
import {
    useData,
    useRoute,
    type EnhanceAppContext,
    type Theme
} from 'vitepress'

import DefaultTheme from 'vitepress/theme-without-fonts'

import Layout from './layout.vue'

import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'

import giscusTalk from 'vitepress-plugin-comment-with-giscus'

import '../../tailwind.css'

export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }: EnhanceAppContext) {
        app.use(TwoslashFloatingVue)
    },
    setup() {
        const { frontmatter } = toRefs(useData())
        const route = useRoute()
        giscusTalk(
            {
                repo: 'vafast/vafast',
                repoId: 'R_kgDOPeUrFQ',
                category: 'General',
                categoryId: 'DIC_kwDOPeUrFc4C0rb0',
                mapping: 'pathname',
                strict: '0',
                reactionsEnabled: '1',
                emitMetadata: '0',
                inputPosition: 'bottom',
                lang: 'zh-CN',
                crossorigin: 'anonymous',
                lightTheme: 'light',
                darkTheme: 'transparent_dark',
                loading: 'lazy'
            },
            { frontmatter, route },
            true
        )
    }
} satisfies Theme
