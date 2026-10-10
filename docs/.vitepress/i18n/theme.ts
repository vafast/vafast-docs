// 各语言的导航、侧边栏与主题文案（供 config.ts 使用，仅在 Node 端加载）
// Per-locale nav, sidebar and theme labels (used by config.ts, Node side only)
import type { DefaultTheme } from 'vitepress'

export type LocaleKey = 'root' | 'en'

/** 双语文案 / bilingual label */
type Label = { zh: string; en: string }
type Item = Label & { link: string }
type Group = Label & { collapsed: boolean; items: Item[] }

/** 无需翻译的名称（包名、产品名） / names that stay the same in both locales */
const same = (name: string): Label => ({ zh: name, en: name })

const nav: (Label & { link?: string; items?: Item[] })[] = [
    {
        zh: '生态',
        en: 'Ecosystem',
        items: [
            { zh: '中间件', en: 'Middleware', link: '/middleware/overview' },
            { zh: 'API 客户端', en: 'API Client', link: '/api-client/overview' },
            { zh: '集成', en: 'Integrations', link: '/integrations/drizzle' }
        ]
    },
    { zh: '社区', en: 'Community', link: '/community' },
    { zh: '博客', en: 'Blog', link: '/blog' }
]

const middlewarePackages: [string, string][] = [
    ['Bearer', 'bearer'],
    ['Compress', 'compress'],
    ['Cookie', 'cookie'],
    ['CORS', 'cors'],
    ['Cron', 'cron'],
    ['Helmet', 'helmet'],
    ['HTML', 'html'],
    ['IP', 'ip'],
    ['Auth Middleware', 'auth-middleware'],
    ['JWT', 'jwt'],
    ['Logger', 'logger'],
    ['OpenTelemetry', 'opentelemetry'],
    ['Permission', 'permission'],
    ['Rate Limit', 'rate-limit'],
    ['Request ID', 'request-id'],
    ['Request Logger', 'request-logger'],
    ['Server Timing', 'server-timing'],
    ['Static', 'static'],
    ['Swagger', 'swagger'],
    ['Webhook', 'webhook']
]

const sidebar: Group[] = [
    {
        zh: '入门',
        en: 'Getting Started',
        collapsed: false,
        items: [
            { zh: '概览', en: 'At a Glance', link: '/at-glance' },
            { zh: '快速开始', en: 'Quick Start', link: '/quick-start' },
            { zh: '教程', en: 'Tutorial', link: '/tutorial' },
            { zh: '关键概念', en: 'Key Concepts', link: '/key-concept' }
        ]
    },
    {
        zh: '核心',
        en: 'Essentials',
        collapsed: true,
        items: [
            { zh: '路由', en: 'Routing', link: '/routing' },
            { zh: '处理程序', en: 'Handler', link: '/essential/handler' },
            { zh: '验证', en: 'Validation', link: '/essential/validation' },
            { zh: '中间件系统', en: 'Middleware System', link: '/middleware' },
            { zh: 'SSE 流式响应', en: 'SSE Streaming', link: '/essential/sse' },
            { zh: '组件路由', en: 'Component Routing', link: '/component-routing' }
        ]
    },
    {
        zh: '进阶',
        en: 'Advanced',
        collapsed: true,
        items: [
            { zh: '最佳实践', en: 'Best Practices', link: '/essential/best-practice' },
            { zh: '类型系统', en: 'Type System', link: '/patterns/type' },
            { zh: '单元测试', en: 'Unit Testing', link: '/patterns/unit-test' },
            { zh: '部署指南', en: 'Deployment', link: '/patterns/deploy' },
            { zh: '链路追踪', en: 'Tracing & Monitoring', link: '/patterns/trace' }
        ]
    },
    {
        zh: '迁移指南',
        en: 'Migration',
        collapsed: true,
        items: [
            { zh: '从 Express 迁移', en: 'From Express', link: '/migrate/from-express' },
            { zh: '从 Fastify 迁移', en: 'From Fastify', link: '/migrate/from-fastify' },
            { zh: '从 Hono 迁移', en: 'From Hono', link: '/migrate/from-hono' },
            { zh: '从 Elysia 迁移', en: 'From Elysia', link: '/migrate/from-elysia' }
        ]
    },
    {
        zh: 'API 客户端',
        en: 'API Client',
        collapsed: true,
        items: [
            { zh: '概述', en: 'Overview', link: '/api-client/overview' },
            { zh: '对比', en: 'Comparison', link: '/api-client/comparison' },
            { zh: '安装', en: 'Installation', link: '/api-client/installation' },
            { zh: '基础用法', en: 'Basic Usage', link: '/api-client/fetch' },
            { zh: '高级用法', en: 'Advanced Usage', link: '/api-client/advanced' },
            { zh: '测试', en: 'Testing', link: '/api-client/test' }
        ]
    },
    {
        zh: '中间件',
        en: 'Middleware',
        collapsed: true,
        items: [
            { zh: '概述', en: 'Overview', link: '/middleware/overview' },
            ...middlewarePackages.map(([name, slug]) => ({
                ...same(name),
                link: `/middleware/${slug}`
            }))
        ]
    },
    {
        zh: '数据库',
        en: 'Databases',
        collapsed: true,
        items: [
            { ...same('Drizzle'), link: '/integrations/drizzle' },
            { ...same('Prisma'), link: '/integrations/prisma' }
        ]
    },
    {
        zh: '前端框架',
        en: 'Frontend Frameworks',
        collapsed: true,
        items: [
            { ...same('Next.js'), link: '/integrations/nextjs' },
            { ...same('Nuxt'), link: '/integrations/nuxt' },
            { ...same('Astro'), link: '/integrations/astro' },
            { ...same('SvelteKit'), link: '/integrations/sveltekit' },
            { ...same('Expo'), link: '/integrations/expo' }
        ]
    },
    {
        zh: '工具',
        en: 'Tools',
        collapsed: true,
        items: [
            { zh: '脚手架工具', en: 'Scaffolding (create-app)', link: '/tools/create-app' },
            { zh: 'CLI 工具', en: 'CLI', link: '/tools/cli' },
            { ...same('Claude Skill'), link: '/tools/skill' }
        ]
    },
    {
        zh: '工具集成',
        en: 'Tool Integrations',
        collapsed: true,
        items: [
            { ...same('OpenAPI'), link: '/integrations/openapi' },
            { ...same('OpenTelemetry'), link: '/integrations/opentelemetry' },
            { ...same('Better Auth'), link: '/integrations/better-auth' },
            { ...same('React Email'), link: '/integrations/react-email' },
            { zh: '速查表', en: 'Cheat Sheet', link: '/integrations/cheat-sheet' }
        ]
    },
    {
        zh: 'API 参考',
        en: 'API Reference',
        collapsed: true,
        items: [{ zh: 'API 文档', en: 'API Docs', link: '/api' }]
    }
]

const lang = (locale: LocaleKey) => (locale === 'root' ? 'zh' : 'en')
const prefix = (locale: LocaleKey, link: string) =>
    locale === 'root' ? link : `/${locale}${link}`

/**
 * 顶部导航只放本站（Vafast 文档）自己的入口；okayok.ai 主站和其他 OK 产品的链接
 * 只放在页脚（okayok-footer.vue，数据来自 okayok_products）。
 * Header nav lists only this site's own sections; main-site / product-family
 * links live only in the footer.
 */
export function buildNav(locale: LocaleKey): DefaultTheme.NavItem[] {
    const l = lang(locale)
    return [
        ...nav.map((entry) =>
            entry.items
                ? {
                      text: entry[l],
                      items: entry.items.map((i) => ({ text: i[l], link: prefix(locale, i.link) }))
                  }
                : { text: entry[l], link: prefix(locale, entry.link!) }
        )
    ]
}

export function buildSidebar(locale: LocaleKey): DefaultTheme.SidebarItem[] {
    const l = lang(locale)
    return sidebar.map((group) => ({
        text: group[l],
        collapsed: group.collapsed,
        items: group.items.map((i) => ({ text: i[l], link: prefix(locale, i.link) }))
    }))
}

/** 主题 UI 文案 / theme UI labels */
const labels = {
    zh: {
        outline: { level: 2, label: '本页目录' },
        editLink: '在 GitHub 上编辑此页',
        docFooter: { prev: '上一页', next: '下一页' },
        lastUpdated: '最后更新于',
        langMenuLabel: '切换语言',
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
        skipToContentLabel: '跳转到内容',
        notFound: {
            title: '页面未找到',
            quote: '你访问的页面不存在，或已被移动。',
            linkLabel: '前往首页',
            linkText: '返回首页'
        }
    },
    en: {
        outline: { level: 2, label: 'On this page' },
        editLink: 'Edit this page on GitHub',
        docFooter: { prev: 'Previous', next: 'Next' },
        lastUpdated: 'Last updated',
        langMenuLabel: 'Languages',
        returnToTopLabel: 'Back to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Theme',
        lightModeSwitchTitle: 'Switch to light mode',
        darkModeSwitchTitle: 'Switch to dark mode',
        skipToContentLabel: 'Skip to content',
        notFound: {
            title: 'PAGE NOT FOUND',
            quote: "The page you're looking for doesn't exist or has been moved.",
            linkLabel: 'Go to home',
            linkText: 'Take me home'
        }
    }
} as const

export function buildThemeConfig(locale: LocaleKey): DefaultTheme.Config {
    const t = labels[lang(locale)]
    return {
        nav: buildNav(locale),
        sidebar: buildSidebar(locale),
        outline: { level: t.outline.level, label: t.outline.label },
        editLink: {
            text: t.editLink,
            pattern: 'https://github.com/vafast/vafast-docs/tree/main/docs/:path'
        },
        docFooter: { ...t.docFooter },
        lastUpdated: {
            text: t.lastUpdated,
            formatOptions: { dateStyle: 'short', timeStyle: 'medium' }
        },
        langMenuLabel: t.langMenuLabel,
        returnToTopLabel: t.returnToTopLabel,
        sidebarMenuLabel: t.sidebarMenuLabel,
        darkModeSwitchLabel: t.darkModeSwitchLabel,
        lightModeSwitchTitle: t.lightModeSwitchTitle,
        darkModeSwitchTitle: t.darkModeSwitchTitle,
        skipToContentLabel: t.skipToContentLabel,
        notFound: { ...t.notFound }
    }
}

/** 本地搜索各语言文案 / local search translations per locale */
export const searchLocales = {
    root: {
        translations: {
            button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
            modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '清除查询条件',
                backButtonTitle: '关闭搜索',
                noResultsText: '没有找到相关结果',
                footer: {
                    selectText: '选择',
                    selectKeyAriaLabel: '回车',
                    navigateText: '切换',
                    navigateUpKeyAriaLabel: '上箭头',
                    navigateDownKeyAriaLabel: '下箭头',
                    closeText: '关闭',
                    closeKeyAriaLabel: 'Esc'
                }
            }
        }
    },
    en: {
        translations: {
            button: { buttonText: 'Search Docs', buttonAriaLabel: 'Search Docs' },
            modal: {
                displayDetails: 'Display detailed list',
                resetButtonTitle: 'Clear query',
                backButtonTitle: 'Close search',
                noResultsText: 'No results found',
                footer: {
                    selectText: 'Select',
                    selectKeyAriaLabel: 'Enter',
                    navigateText: 'Navigate',
                    navigateUpKeyAriaLabel: 'Up arrow',
                    navigateDownKeyAriaLabel: 'Down arrow',
                    closeText: 'Close',
                    closeKeyAriaLabel: 'Esc'
                }
            }
        }
    }
}
