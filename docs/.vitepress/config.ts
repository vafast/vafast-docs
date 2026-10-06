import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig, type HeadConfig } from 'vitepress'

import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { createFileSystemTypesCache } from '@shikijs/vitepress-twoslash/cache-fs'

import lightbox from 'vitepress-plugin-lightbox'

import tailwindcss from '@tailwindcss/vite'
import llmstxt from 'vitepress-plugin-llms'
import { analyzer } from 'vite-bundle-analyzer'

// 站点域名（sitemap / canonical / og:url / robots.txt / JSON-LD 统一使用此常量）
// 自定义域名部署：https://vafast.okayok.ai/
const SITE_URL = 'https://vafast.okayok.ai'

const SITE_NAME = 'Vafast 中文文档'
const OG_IMAGE = `${SITE_URL}/assets/vafast.png`
const VAFAST_VERSION = '0.8.5'

const description =
    'Vafast 是高性能、类型安全的 TypeScript Web 框架，支持 Node.js、Bun 与 Cloudflare Workers，提供声明式路由、自动类型推断、内置 Schema 验证和丰富的中间件生态，是 Hono、Elysia、Express 的轻量替代方案。'

const base = '/'

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

const softwareApplicationLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vafast',
    description,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform (Node.js, Bun, Cloudflare Workers)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: 'https://opensource.org/licenses/MIT',
    softwareVersion: VAFAST_VERSION,
    url: SITE_URL,
    image: OG_IMAGE,
    codeRepository: 'https://github.com/vafast/vafast',
    sameAs: [
        'https://github.com/vafast/vafast',
        'https://www.npmjs.com/package/vafast'
    ]
}

const webSiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'Vafast',
    url: SITE_URL,
    inLanguage: 'zh-CN',
    description
}

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
            lang: 'zh-CN'
        },
        en: {
            label: 'English',
            lang: 'en',
            link: 'https://vafast.dev/'
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
        ['meta', { property: 'og:site_name', content: SITE_NAME }],
        ['meta', { property: 'og:locale', content: 'zh_CN' }],
        ['meta', { property: 'og:image', content: OG_IMAGE }],
        ['meta', { property: 'og:image:width', content: '512' }],
        ['meta', { property: 'og:image:height', content: '512' }],
        ['meta', { property: 'og:image:alt', content: 'Vafast Logo' }],
        ['meta', { name: 'twitter:card', content: 'summary' }],
        ['meta', { name: 'twitter:image', content: OG_IMAGE }],
        ...analyticsHead
    ],
    // 每页 SEO：canonical、Open Graph、Twitter Card、JSON-LD
    transformHead({ pageData, title, description: pageDescription }) {
        if (pageData.isNotFound) return

        const url = pageUrl(pageData.relativePath)
        const desc = pageDescription || description
        const isHome = pageData.relativePath === 'index.md'
        const isBlogPost = pageData.relativePath.startsWith('blog/')

        const head: HeadConfig[] = [
            ['link', { rel: 'canonical', href: url }],
            ['meta', { property: 'og:type', content: isBlogPost ? 'article' : 'website' }],
            ['meta', { property: 'og:title', content: title }],
            ['meta', { property: 'og:description', content: desc }],
            ['meta', { property: 'og:url', content: url }],
            ['meta', { name: 'twitter:title', content: title }],
            ['meta', { name: 'twitter:description', content: desc }]
        ]

        if (isHome) head.push(jsonLd(softwareApplicationLd), jsonLd(webSiteLd))

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
                locales: {
                    root: {
                        translations: {
                            button: {
                                buttonText: 'Search Docs',
                                buttonAriaLabel: 'Search Docs'
                            },
                            modal: {
                                noResultsText: 'No results found',
                                resetButtonTitle: 'Clear query',
                                footer: {
                                    selectText: 'Select',
                                    navigateText: 'Navigate'
                                }
                            }
                        }
                    }
                }
            }
        },
        logo: '/assets/vafast.svg',
        nav: [
            {
                text: '生态',
                items: [
                    {
                        text: '中间件',
                        link: '/middleware/overview'
                    },
                    {
                        text: 'API 客户端',
                        link: '/api-client/overview'
                    },
                    {
                        text: '集成',
                        link: '/integrations/drizzle'
                    }
                ]
            },
            {
                text: '社区',
                link: '/community'
            },
            {
                text: '博客',
                link: '/blog'
            }
        ],
        sidebar: [
            {
                text: '入门',
                collapsed: false,
                items: [
                    {
                        text: '概览',
                        link: '/at-glance'
                    },
                    {
                        text: '快速开始',
                        link: '/quick-start'
                    },
                    {
                        text: '教程',
                        link: '/tutorial'
                    },
                    {
                        text: '关键概念',
                        link: '/key-concept'
                    }
                ]
            },
            {
                text: '核心',
                collapsed: true,
                items: [
                    {
                        text: '路由',
                        link: '/routing'
                    },
                    {
                        text: '处理程序',
                        link: '/essential/handler'
                    },
                    {
                        text: '验证',
                        link: '/essential/validation'
                    },
                    {
                        text: '中间件系统',
                        link: '/middleware'
                    },
                    {
                        text: 'SSE 流式响应',
                        link: '/essential/sse'
                    },
                    {
                        text: '组件路由',
                        link: '/component-routing'
                    }
                ]
            },
            {
                text: '进阶',
                collapsed: true,
                items: [
                    {
                        text: '最佳实践',
                        link: '/essential/best-practice'
                    },
                    {
                        text: '类型系统',
                        link: '/patterns/type'
                    },
                    {
                        text: '单元测试',
                        link: '/patterns/unit-test'
                    },
                    {
                        text: '部署指南',
                        link: '/patterns/deploy'
                    },
                    {
                        text: '链路追踪',
                        link: '/patterns/trace'
                    }
                ]
            },
            {
                text: '迁移指南',
                collapsed: true,
                items: [
                    {
                        text: '从 Express 迁移',
                        link: '/migrate/from-express'
                    },
                    {
                        text: '从 Fastify 迁移',
                        link: '/migrate/from-fastify'
                    },
                    {
                        text: '从 Hono 迁移',
                        link: '/migrate/from-hono'
                    },
                    {
                        text: '从 Elysia 迁移',
                        link: '/migrate/from-elysia'
                    }
                ]
            },
            {
                text: 'API 客户端',
                collapsed: true,
                items: [
                    {
                        text: '概述',
                        link: '/api-client/overview'
                    },
                    {
                        text: '对比',
                        link: '/api-client/comparison'
                    },
                    {
                        text: '安装',
                        link: '/api-client/installation'
                    },
                    {
                        text: '基础用法',
                        link: '/api-client/fetch'
                    },
                    {
                        text: '高级用法',
                        link: '/api-client/advanced'
                    },
                    {
                        text: '测试',
                        link: '/api-client/test'
                    }
                ]
            },
            {
                text: '中间件',
                collapsed: true,
                items: [
                    {
                        text: '概述',
                        link: '/middleware/overview'
                    },
                    {
                        text: 'Bearer',
                        link: '/middleware/bearer'
                    },
                    {
                        text: 'Compress',
                        link: '/middleware/compress'
                    },
                    {
                        text: 'Cookie',
                        link: '/middleware/cookie'
                    },
                    {
                        text: 'CORS',
                        link: '/middleware/cors'
                    },
                    {
                        text: 'Cron',
                        link: '/middleware/cron'
                    },
                    {
                        text: 'Helmet',
                        link: '/middleware/helmet'
                    },
                    {
                        text: 'HTML',
                        link: '/middleware/html'
                    },
                    {
                        text: 'IP',
                        link: '/middleware/ip'
                    },
                    {
                        text: 'Auth Middleware',
                        link: '/middleware/auth-middleware'
                    },
                    {
                        text: 'JWT',
                        link: '/middleware/jwt'
                    },
                    {
                        text: 'Logger',
                        link: '/middleware/logger'
                    },
                    {
                        text: 'OpenTelemetry',
                        link: '/middleware/opentelemetry'
                    },
                    {
                        text: 'Permission',
                        link: '/middleware/permission'
                    },
                    {
                        text: 'Rate Limit',
                        link: '/middleware/rate-limit'
                    },
                    {
                        text: 'Request ID',
                        link: '/middleware/request-id'
                    },
                    {
                        text: 'Request Logger',
                        link: '/middleware/request-logger'
                    },
                    {
                        text: 'Server Timing',
                        link: '/middleware/server-timing'
                    },
                    {
                        text: 'Static',
                        link: '/middleware/static'
                    },
                    {
                        text: 'Swagger',
                        link: '/middleware/swagger'
                    },
                    {
                        text: 'Webhook',
                        link: '/middleware/webhook'
                    }
                ]
            },
            {
                text: '数据库',
                collapsed: true,
                items: [
                    {
                        text: 'Drizzle',
                        link: '/integrations/drizzle'
                    },
                    {
                        text: 'Prisma',
                        link: '/integrations/prisma'
                    }
                ]
            },
            {
                text: '前端框架',
                collapsed: true,
                items: [
                    {
                        text: 'Next.js',
                        link: '/integrations/nextjs'
                    },
                    {
                        text: 'Nuxt',
                        link: '/integrations/nuxt'
                    },
                    {
                        text: 'Astro',
                        link: '/integrations/astro'
                    },
                    {
                        text: 'SvelteKit',
                        link: '/integrations/sveltekit'
                    },
                    {
                        text: 'Expo',
                        link: '/integrations/expo'
                    }
                ]
            },
            {
                text: '工具',
                collapsed: true,
                items: [
                    {
                        text: '脚手架工具',
                        link: '/tools/create-app'
                    },
                    {
                        text: 'CLI 工具',
                        link: '/tools/cli'
                    },
                    {
                        text: 'Claude Skill',
                        link: '/tools/skill'
                    }
                ]
            },
            {
                text: '工具集成',
                collapsed: true,
                items: [
                    {
                        text: 'OpenAPI',
                        link: '/integrations/openapi'
                    },
                    {
                        text: 'OpenTelemetry',
                        link: '/integrations/opentelemetry'
                    },
                    {
                        text: 'Better Auth',
                        link: '/integrations/better-auth'
                    },
                    {
                        text: 'React Email',
                        link: '/integrations/react-email'
                    },
                    {
                        text: '速查表',
                        link: '/integrations/cheat-sheet'
                    }
                ]
            },
            {
                text: 'API 参考',
                collapsed: true,
                items: [
                    {
                        text: 'API 文档',
                        link: '/api'
                    }
                ]
            }
        ],
        outline: {
            level: 2,
            label: 'Page Navigation'
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/vafast/vafast' }
        ],
        editLink: {
            text: 'Edit this page on GitHub',
            pattern: 'https://github.com/vafast/vafast-docs/tree/main/docs/:path'
        },
        docFooter: {
            prev: 'Previous',
            next: 'Next'
        },
        lastUpdated: {
            text: 'Last updated',
            formatOptions: {
                dateStyle: 'short',
                timeStyle: 'medium'
            }
        },
        langMenuLabel: 'Languages',
        returnToTopLabel: 'Back to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Theme',
        lightModeSwitchTitle: 'Switch to light mode',
        darkModeSwitchTitle: 'Switch to dark mode'
    }
})
