import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig, type HeadConfig } from 'vitepress'

import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { createFileSystemTypesCache } from '@shikijs/vitepress-twoslash/cache-fs'

import lightbox from 'vitepress-plugin-lightbox'

import tailwindcss from '@tailwindcss/vite'
import llmstxt from 'vitepress-plugin-llms'
import { analyzer } from 'vite-bundle-analyzer'

import { buildThemeConfig, searchLocales } from './i18n/theme'

// 站点域名（sitemap / canonical / og:url / robots.txt / JSON-LD 统一使用此常量）
// 自定义域名部署：https://vafast.okayok.ai/
const SITE_URL = 'https://vafast.okayok.ai'

// 站点品牌：Vafast 保持独立品牌（Okayok 只出现在页脚产品栏）
const SITE_NAME = 'Vafast 中文文档'
const SITE_NAME_EN = 'Vafast Docs'
const OG_IMAGE = `${SITE_URL}/assets/vafast.png`
const VAFAST_VERSION = '0.8.5'

const description =
    'Vafast 是高性能、类型安全的 TypeScript Web 框架，支持 Node.js、Bun 与 Cloudflare Workers，提供声明式路由、自动类型推断、内置 Schema 验证和丰富的中间件生态，是 Hono、Elysia、Express 的轻量替代方案。'

const descriptionEn =
    'Vafast is a high-performance, type-safe TypeScript web framework for Node.js, Bun and Cloudflare Workers, with declarative routing, automatic type inference, built-in schema validation and a rich middleware ecosystem: a lightweight alternative to Hono, Elysia and Express.'

const base = '/'

/** 语言配置：root = 简体中文，en = English（/en/） */
const LOCALES = {
    root: {
        lang: 'zh-CN',
        hreflang: 'zh-CN',
        ogLocale: 'zh_CN',
        siteName: SITE_NAME,
        description,
        keywords:
            'Vafast, TypeScript Web 框架, Node.js 框架, Bun 框架, 类型安全, Schema 验证, 声明式路由, Cloudflare Workers, Hono 替代, Elysia 替代, Express 替代'
    },
    en: {
        lang: 'en-US',
        hreflang: 'en',
        ogLocale: 'en_US',
        siteName: SITE_NAME_EN,
        description: descriptionEn,
        keywords:
            'Vafast, TypeScript web framework, Node.js framework, Bun framework, type-safe API, schema validation, declarative routing, Cloudflare Workers, Hono alternative, Elysia alternative, Express alternative'
    }
} as const
type LocaleKey = keyof typeof LOCALES

const localeOf = (relativePath: string): LocaleKey =>
    relativePath.startsWith('en/') ? 'en' : 'root'

/** 某页面在另一语言中的对应路径 / counterpart page path in the other locale */
const counterpartOf = (relativePath: string) =>
    localeOf(relativePath) === 'en' ? relativePath.slice(3) : `en/${relativePath}`

// 统计脚本仅在生产构建（vitepress build）中注入，vitepress dev 不加载
const isProd = process.env.NODE_ENV === 'production'

// Google Analytics 4（GA4 媒体资源 okayok.ai 557591759，网站数据流 vafast.okayok.ai 16051774439）
const GA_MEASUREMENT_ID = 'G-7C40ZTS4FL'

// Microsoft Clarity（与 Okayok 各站点共用的 Clarity 项目）
const CLARITY_PROJECT_ID = 'ytbudga4p7'

// GA4 增强型衡量会自动跟踪 SPA 的 history 路由变化，这里不手动发送 page_view，避免重复
const analyticsHead: HeadConfig[] = isProd
    ? [
          [
              'script',
              {
                  async: '',
                  src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
              }
          ],
          [
              'script',
              {},
              `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`
          ],
          [
              'script',
              { type: 'text/javascript' },
              `(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`
          ]
      ]
    : []

/** 将 VitePress 页面相对路径转换为线上 URL（与 sitemap 保持一致，未开启 cleanUrls） */
function pageUrl(relativePath: string) {
    const path = relativePath
        .replace(/(^|\/)index\.md$/, '$1')
        .replace(/\.md$/, '.html')
    return `${SITE_URL}${base}${path}`
}

const jsonLd = (data: Record<string, unknown>): HeadConfig => [
    'script',
    { type: 'application/ld+json' },
    JSON.stringify(data)
]

const softwareApplicationLd = (locale: LocaleKey) => ({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vafast',
    description: LOCALES[locale].description,
    inLanguage: LOCALES[locale].lang,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform (Node.js, Bun, Cloudflare Workers)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: 'https://opensource.org/licenses/MIT',
    softwareVersion: VAFAST_VERSION,
    url: pageUrl(locale === 'en' ? 'en/index.md' : 'index.md'),
    image: OG_IMAGE,
    codeRepository: 'https://github.com/vafast/vafast',
    sameAs: [
        'https://github.com/vafast/vafast',
        'https://www.npmjs.com/package/vafast'
    ]
})

const webSiteLd = (locale: LocaleKey) => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: LOCALES[locale].siteName,
    alternateName: 'Vafast',
    url: pageUrl(locale === 'en' ? 'en/index.md' : 'index.md'),
    inLanguage: LOCALES[locale].lang,
    description: LOCALES[locale].description
})

export default defineConfig({
    base,
    lang: 'zh-CN',
    title: SITE_NAME,
    titleTemplate: ':title - Vafast 中文文档',
    description,

    sitemap: {
        hostname: SITE_URL
    },
    locales: {
        root: {
            label: '简体中文',
            lang: 'zh-CN',
            themeConfig: buildThemeConfig('root')
        },
        en: {
            label: 'English',
            lang: 'en-US',
            link: '/en/',
            title: SITE_NAME_EN,
            titleTemplate: ':title - Vafast Docs',
            description: descriptionEn,
            themeConfig: buildThemeConfig('en')
        }
    },
    ignoreDeadLinks: true,
    lastUpdated: true,
    markdown: {
        theme: {
            light: 'github-light',
            dark: 'github-dark'
        },
        languages: ['js', 'ts'],
        codeTransformers: [
            transformerTwoslash({
                typesCache: createFileSystemTypesCache({
                    dir: './docs/.vitepress/cache/twoslash'
                })
            })
        ],
        config: (md) => {
            md.use(lightbox, {})
        }
    },
    vite: {
        base, // 确保 Vite 构建时也使用正确的 base
        server: {
            watch: {
                usePolling: true
            }
        },
        experimental: {
            enableNativePlugin: true
        },
        plugins: [
            tailwindcss(),
            process.env.NODE_ENV === 'production'
                ? llmstxt({
                    description: '高性能 TypeScript Web 框架',
                    details:
                        'Vafast 是一个高性能、类型安全的 TypeScript Web 框架，专为现代 Web 应用设计。提供优秀的开发者体验、灵活的中间件系统、组件路由支持和完整的类型安全。',
                    ignoreFiles: [
                        'index.md',
                        'blog/*',
                        'en/**',
                        'public/*'
                    ],
                    domain: 'https://vafast.dev'
                })
                : undefined,
            process.env.ANALYZE === 'true' ? analyzer() : undefined
        ],
        optimizeDeps: {
            exclude: ['@nolebase/vitepress-plugin-inline-link-preview/client']
        },
        ssr: {
            noExternal: [
                '@nolebase/vitepress-plugin-inline-link-preview',
                '@nolebase/ui'
            ]
        }
    },
    head: [
        [
            'meta',
            {
                name: 'viewport',
                content: 'width=device-width,initial-scale=1,user-scalable=no'
            }
        ],
        [
            'link',
            {
                rel: 'icon',
                href: `${base}assets/vafast.svg`,
                type: 'image/svg+xml'
            }
        ],
        ['meta', { property: 'og:image', content: OG_IMAGE }],
        ['meta', { property: 'og:image:width', content: '512' }],
        ['meta', { property: 'og:image:height', content: '512' }],
        ['meta', { property: 'og:image:alt', content: 'Vafast Logo' }],
        ['meta', { name: 'twitter:card', content: 'summary' }],
        ['meta', { name: 'twitter:image', content: OG_IMAGE }],
        ...analyticsHead
    ],
    // 每页 SEO：canonical、hreflang、Open Graph、Twitter Card、JSON-LD（按语言区分）
    transformHead({ pageData, title, description: pageDescription, siteConfig }) {
        if (pageData.isNotFound) return

        const relativePath = pageData.relativePath
        const locale = localeOf(relativePath)
        const meta = LOCALES[locale]
        const url = pageUrl(relativePath)
        const desc = pageDescription || meta.description
        const isHome = relativePath === 'index.md' || relativePath === 'en/index.md'
        const isBlogPost = /^(en\/)?blog\//.test(relativePath)

        const head: HeadConfig[] = [
            ['link', { rel: 'canonical', href: url }],
            ['meta', { property: 'og:site_name', content: meta.siteName }],
            ['meta', { property: 'og:locale', content: meta.ogLocale }],
            ['meta', { property: 'og:type', content: isBlogPost ? 'article' : 'website' }],
            ['meta', { property: 'og:title', content: title }],
            ['meta', { property: 'og:description', content: desc }],
            ['meta', { property: 'og:url', content: url }],
            ['meta', { name: 'twitter:title', content: title }],
            ['meta', { name: 'twitter:description', content: desc }]
        ]

        // hreflang：仅当另一语言存在对应页面时输出；x-default 指向中文根路径
        const counterpart = counterpartOf(relativePath)
        if (siteConfig.pages.includes(counterpart)) {
            const zhPath = locale === 'root' ? relativePath : counterpart
            const enPath = locale === 'en' ? relativePath : counterpart
            const alternateLocale = locale === 'root' ? LOCALES.en.ogLocale : LOCALES.root.ogLocale
            head.push(
                ['link', { rel: 'alternate', hreflang: LOCALES.root.hreflang, href: pageUrl(zhPath) }],
                ['link', { rel: 'alternate', hreflang: LOCALES.en.hreflang, href: pageUrl(enPath) }],
                ['link', { rel: 'alternate', hreflang: 'x-default', href: pageUrl(zhPath) }],
                ['meta', { property: 'og:locale:alternate', content: alternateLocale }]
            )
        }

        if (isHome)
            head.push(
                ['meta', { name: 'keywords', content: meta.keywords }],
                jsonLd(softwareApplicationLd(locale)),
                jsonLd(webSiteLd(locale))
            )

        return head
    },
    // 生成 robots.txt（含 sitemap 提交路径）
    buildEnd(siteConfig) {
        writeFileSync(
            resolve(siteConfig.outDir, 'robots.txt'),
            `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
        )
    },
    themeConfig: {
        search: {
            provider: 'local',
            options: {
                detailedView: true,
                locales: searchLocales
            }
        },
        logo: '/assets/vafast.svg',
        socialLinks: [
            { icon: 'github', link: 'https://github.com/vafast/vafast' }
        ]
    }
})
