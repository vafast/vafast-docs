// 首页（fern 组件）中文文案。新增字段时请同步更新 en.ts（类型由本文件推导）
const zh = {
    hero: {
        copyCommand: '复制命令',
        srOnly: 'Vafast – 高性能 TypeScript Web 框架：',
        title: '轻量、快速、类型安全',
        subtitle: '基于 TypeScript 的现代 Web 框架，声明式路由、自动类型推断、内置 Schema 验证',
        runtimes: '支持 Node.js、Bun、Cloudflare Workers',
        getStarted: '快速开始',
        scrollHint: '向下滚动了解更多'
    },
    features: {
        heading: '核心特性',
        description: '简洁的 API、强大的类型推断、内置验证，专为高效开发设计',
        items: [
            { title: '极致性能', subtitle: '比 Express 快 1.8x', description: 'JIT 编译验证器 · Radix Tree 路由' },
            { title: '类型安全', subtitle: '端到端类型推断', description: 'Schema → Type · 跨文件类型' },
            { title: '声明式路由', subtitle: '结构即真相', description: '路由即数组 · 显式中间件' },
            { title: '跨运行时', subtitle: '一套代码，任意环境', description: 'Node.js · Bun · Cloudflare Workers' }
        ]
    },
    benchmark: {
        fasterThanExpress: '比 Express 更快',
        requestsPerSecond: '请求/秒',
        environment: '测试环境：Bun 1.2.20, macOS, wrk (4线程, 100连接, 30s)'
    },
    easy: {
        heading: '为开发者而生',
        description: 'API 设计符合直觉，几乎没有学习成本。不搞复杂抽象，你写的代码就是最终运行的样子。',
        principles: [
            { title: '自动响应', desc: '返回对象自动转 JSON，返回字符串自动设置 Content-Type' },
            { title: '语义化错误', desc: '内置 err.notFound() 等方法，统一错误响应格式' },
            { title: '声明式路由', desc: '路由就是数组，所有接口一目了然' },
            { title: '跨运行时', desc: '同一份代码跑在 Node.js、Bun、Workers' }
        ]
    },
    typeIntegrity: {
        heading: '从请求到响应，全程有类型',
        labels: ['路径参数', 'Schema 验证', '错误处理', '额外上下文']
    },
    e2e: {
        heading: '类型自动同步',
        description: '服务端定义好接口，客户端自动获得完整类型提示，不用手动写类型、不用生成代码。',
        points: ['自动类型推断', '零配置同步', '编译时检查']
    },
    test: {
        heading: '错误提前暴露',
        // 含 HTML，使用 v-html 渲染
        descriptionHtml:
            '缺少字段、类型不对？写代码时 IDE 就会提示，不用等到运行才发现问题。配合 <code class="text-violet-500 font-mono text-sm">@vafast/api-client</code>，测试代码也能享受完整的类型推断。'
    },
    deploy: {
        heading: '一套代码，到处运行',
        description:
            '基于 Web 标准 Fetch API 构建，不绑定任何运行时。同一份代码可以部署到 Node.js、Bun、Cloudflare Workers 等任意平台。'
    },
    sponsor: {
        heading: '由你实现',
        description: 'Vafast 不是由某个组织拥有，而是由社区推动。您的支持让 Vafast 得以持续发展。',
        cta: '成为赞助商',
        thanks: 'Thank you for making Vafast possible'
    },
    future: {
        heading: '准备好了吗？',
        description: '几分钟搭建你的第一个 Vafast 项目，体验高效的 API 开发',
        getStarted: '快速开始',
        tutorial: '教程'
    },
    footer: {
        tagline: '- 高性能 TypeScript Web 框架'
    }
}

export type Messages = typeof zh
export default zh
