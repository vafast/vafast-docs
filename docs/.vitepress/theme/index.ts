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

// import giscusTalk from 'vitepress-plugin-comment-with-giscus'  // 评论功能暂时禁用

import '../../tailwind.css'

export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }: EnhanceAppContext) {
        app.use(TwoslashFloatingVue)
    }
    // 评论功能暂时禁用，如需启用请访问 https://giscus.app/ 获取 vafast/vafast 仓库配置
    // setup() {
    //     const { frontmatter } = toRefs(useData())
    //     const route = useRoute()
    //     giscusTalk(
    //         {
    //             repo: 'vafast/vafast',
    //             repoId: '需要从 giscus.app 获取',
    //             category: 'General',
    //             categoryId: '需要从 giscus.app 获取',
    //             mapping: 'pathname',
    //             strict: '0',
    //             reactionsEnabled: '1',
    //             emitMetadata: '0',
    //             inputPosition: 'bottom',
    //             lang: 'zh-CN',
    //             crossorigin: 'anonymous',
    //             lightTheme: 'light',
    //             darkTheme: 'transparent_dark'
    //         },
    //         { frontmatter, route },
    //         true
    //     )
    // }
} satisfies Theme
