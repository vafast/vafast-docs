import { defineConfig } from 'vitepress'

import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { createFileSystemTypesCache } from '@shikijs/vitepress-twoslash/cache-fs'

import lightbox from 'vitepress-plugin-lightbox'

import tailwindcss from '@tailwindcss/vite'
import llmstxt from 'vitepress-plugin-llms'
import { analyzer } from 'vite-bundle-analyzer'

const description =
    'Vafast 是一个高性能、类型安全的 TypeScript Web 框架，专为现代 Web 应用设计，提供优秀的开发者体验和灵活的中间件系统。'

// 自定义域名部署：https://vafast.huyooo.com/
const base = '/'

export default defineConfig({
    base,
    lang: 'zh-CN',
    title: 'Vafast 中文文档',
    titleTemplate: ':title - Vafast 中文文档',

    sitemap: {
        hostname: 'https://vafast.huyooo.com'
    },
    locales: {
        root: {
            label: '简体中文',
            lang: 'zh'
        },
        en: {
            label: 'English',
            lang: 'en',
            link: 'https://vafast.dev/'
        }
    },
    // description,
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
        [
            'meta',
            {
                property: 'og:image',
                content: 'https://vafast.huyooo.com/assets/vafast.svg'
            }
        ],
        [
            'meta',
            {
                property: 'twitter:card',
                content: 'summary_large_image'
            }
        ],
        [
            'meta',
            {
                property: 'twitter:image',
                content: 'https://vafast.huyooo.com/assets/vafast.png'
            }
        ],
        [
            'meta',
            {
                property: 'og:title',
                content: 'Vafast'
            }
        ],
        [
            'meta',
            {
                property: 'og:description',
                content: description
            }
        ],
    ],
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
                        text: '安装',
                        link: '/api-client/installation'
                    },
                    {
                        text: '基础用法',
                        link: '/api-client/fetch'
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
