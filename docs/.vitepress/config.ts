import { defineConfig } from 'vitepress'

import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { createFileSystemTypesCache } from '@shikijs/vitepress-twoslash/cache-fs'

import lightbox from 'vitepress-plugin-lightbox'

import tailwindcss from '@tailwindcss/vite'
import llmstxt from 'vitepress-plugin-llms'
import { analyzer } from 'vite-bundle-analyzer'

const description =
    'Vafast 是一个高性能、类型安全的 TypeScript Web 框架，专为现代 Web 应用设计，提供优秀的开发者体验和灵活的中间件系统。'

export default defineConfig({
    lang: 'zh-CN',
    title: 'Vafast 中文文档',
    titleTemplate: ':title - Vafast 中文文档',

    sitemap: {
        hostname: 'https://vafast.zhcndoc.com'
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
            // @ts-ignore
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
                          'table-of-content.md',
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
                href: '/assets/elysia.png'
            }
        ],
        [
            'meta',
            {
                property: 'og:image',
                content: 'https://elysia.zhcndoc.com/assets/cover_2k.jpg'
            }
        ],
        [
            'meta',
            {
                property: 'og:image:width',
                content: '2560'
            }
        ],
        [
            'meta',
            {
                property: 'og:image:height',
                content: '1440'
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
                content: 'https://elysia.zhcndoc.com/assets/cover_2k.jpg'
            }
        ],
        [
            'meta',
            {
                property: 'og:title',
                content: 'ElysiaJS'
            }
        ],
        [
            'meta',
            {
                property: 'og:description',
                content: description
            }
        ],
        [
            'script',
            {
                async: '',
                src: 'https://www.zhcndoc.com/js/common.js'
            }
        ]
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
        logo: '/assets/elysia.svg',
        nav: [
            {
                text: '中间件',
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
                        text: 'Helmet',
                        link: '/middleware/helmet'
                    },
                    {
                        text: 'IP',
                        link: '/middleware/ip'
                    },
                    {
                        text: 'Rate Limit',
                        link: '/middleware/rate-limit'
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
                        text: 'GraphQL Apollo',
                        link: '/middleware/graphql-apollo'
                    },
                    {
                        text: 'GraphQL Yoga',
                        link: '/middleware/graphql-yoga'
                    },
                    {
                        text: 'HTML',
                        link: '/middleware/html'
                    },
                    {
                        text: 'JWT',
                        link: '/middleware/jwt'
                    },
                    {
                        text: 'OpenTelemetry',
                        link: '/middleware/opentelemetry'
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
                        text: 'Stream',
                        link: '/middleware/stream'
                    },
                    {
                        text: 'Swagger',
                        link: '/middleware/swagger'
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
                collapsed: true,
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
                        link: '/tutorial',
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
                            }
                        ]
                    },
                    {
                        text: '关键概念',
                        link: '/key-concept'
                    },
                    {
                        text: '目录',
                        link: '/table-of-content'
                    }
                ]
            },
            {
                text: '基础',
                collapsed: true,
                items: [
                    {
                        text: '路由指南',
                        link: '/routing'
                    },
                    {
                        text: '中间件系统',
                        link: '/middleware'
                    },
                    {
                        text: '组件路由',
                        link: '/component-routing'
                    },
                    {
                        text: 'API 参考',
                        link: '/api'
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
                        text: '最佳实践',
                        link: '/best-practices'
                    }
                ]
            },
            {
                text: '模式',
                collapsed: true,
                items: [
                    {
                        text: 'Cookie',
                        link: '/patterns/cookie'
                    },
                    {
                        text: '生产环境部署',
                        link: '/patterns/deploy'
                    },
                    {
                        text: '宏指令',
                        link: '/patterns/macro'
                    },
                    {
                        text: '跟踪',
                        link: '/patterns/trace'
                    },
                    {
                        text: '类型',
                        link: '/patterns/type'
                    },
                    {
                        text: '单元测试',
                        link: '/patterns/unit-test'
                    },
                    {
                        text: 'WebSocket',
                        link: '/patterns/websocket'
                    }
                ]
            },
            {
                text: 'API 客户端',
                collapsed: true,
                items: [
                    {
                        text: '概述',
                        link: '/api-client/overview.md'
                    },
                    {
                        text: '安装',
                        link: '/api-client/installation.md'
                    },
                    {
                        text: '类型安全客户端',
                        collapsed: false,
                        items: [
                            {
                                text: '概述',
                                link: '/api-client/treaty/overview'
                            },
                            {
                                text: '参数',
                                link: '/api-client/treaty/parameters'
                            },
                            {
                                text: '响应',
                                link: '/api-client/treaty/response'
                            },
                            {
                                text: 'WebSocket',
                                link: '/api-client/treaty/websocket'
                            },
                            {
                                text: '配置',
                                link: '/api-client/treaty/config'
                            },
                            {
                                text: '单元测试',
                                link: '/api-client/treaty/unit-test'
                            }
                        ]
                    },
                    {
                        text: '基础用法',
                        link: '/api-client/fetch.md'
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
                        text: 'API Client',
                        link: '/middleware/api-client'
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
                        text: 'Helmet',
                        link: '/middleware/helmet'
                    },
                    {
                        text: 'IP',
                        link: '/middleware/ip'
                    },
                    {
                        text: 'Rate Limit',
                        link: '/middleware/rate-limit'
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
                        text: 'GraphQL Apollo',
                        link: '/middleware/graphql-apollo'
                    },
                    {
                        text: 'GraphQL Yoga',
                        link: '/middleware/graphql-yoga'
                    },
                    {
                        text: 'HTML',
                        link: '/middleware/html'
                    },
                    {
                        text: 'JWT',
                        link: '/middleware/jwt'
                    },
                    {
                        text: 'OpenTelemetry',
                        link: '/middleware/opentelemetry'
                    },
                    {
                        text: '服务器计时',
                        link: '/middleware/server-timing'
                    },
                    {
                        text: '静态',
                        link: '/middleware/static'
                    },
                    {
                        text: 'Stream',
                        link: '/middleware/stream'
                    },
                    {
                        text: 'Swagger',
                        link: '/middleware/swagger'
                    }
                ]
            },
            {
                text: '集成',
                collapsed: true,
                items: [
                    {
                        text: 'Astro',
                        link: '/integrations/astro'
                    },
                    {
                        text: 'Better Auth',
                        link: '/integrations/better-auth'
                    },
                    {
                        text: 'Drizzle',
                        link: '/integrations/drizzle'
                    },
                    {
                        text: 'Expo',
                        link: '/integrations/expo'
                    },
                    {
                        text: 'Nextjs',
                        link: '/integrations/nextjs'
                    },
                    {
                        text: 'Nuxt',
                        link: '/integrations/nuxt'
                    },
                    {
                        text: 'OpenAPI',
                        link: '/integrations/openapi'
                    },
                    {
                        text: 'OpenTelemetry',
                        link: '/integrations/opentelemetry'
                    },
                    {
                        text: 'Prisma',
                        link: '/integrations/prisma'
                    },
                    {
                        text: 'React Email',
                        link: '/integrations/react-email'
                    },
                    {
                        text: 'SvelteKit',
                        link: '/integrations/sveltekit'
                    }
                ]
            }
        ],
        outline: {
            level: 2,
            label: 'Page Navigation'
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/elysiajs/elysia' },
            { icon: 'twitter', link: 'https://twitter.com/elysiajs' },
            { icon: 'discord', link: 'https://discord.gg/eaFJ2KDJck' }
        ],
        editLink: {
            text: 'Edit this page on GitHub',
            pattern: 'https://github.com/zhcndoc/elysia/tree/main/docs/:path'
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
