// English copy for the home page (fern components). Must mirror the shape of zh.ts.
import type { Messages } from './zh'

const en: Messages = {
    hero: {
        copyCommand: 'Copy command',
        srOnly: 'Vafast – a high-performance TypeScript web framework: ',
        title: 'Lightweight, fast, type-safe',
        subtitle:
            'A modern TypeScript web framework with declarative routing, automatic type inference and built-in schema validation',
        runtimes: 'Runs on Node.js, Bun and Cloudflare Workers',
        getStarted: 'Get Started',
        scrollHint: 'Scroll down to learn more'
    },
    features: {
        heading: 'Core Features',
        description: 'A clean API, powerful type inference and built-in validation, designed for productive development',
        items: [
            { title: 'Blazing Fast', subtitle: '1.8x faster than Express', description: 'JIT-compiled validators · Radix tree router' },
            { title: 'Type Safe', subtitle: 'End-to-end type inference', description: 'Schema → Type · Cross-file types' },
            { title: 'Declarative Routing', subtitle: 'Structure is the truth', description: 'Routes are arrays · Explicit middleware' },
            { title: 'Cross-Runtime', subtitle: 'One codebase, any environment', description: 'Node.js · Bun · Cloudflare Workers' }
        ]
    },
    benchmark: {
        fasterThanExpress: 'faster than Express',
        requestsPerSecond: 'requests/sec',
        environment: 'Test environment: Bun 1.2.20, macOS, wrk (4 threads, 100 connections, 30s)'
    },
    easy: {
        heading: 'Made for Developers',
        description:
            'An intuitive API with almost no learning curve. No complex abstractions: the code you write is exactly what runs.',
        principles: [
            { title: 'Automatic Responses', desc: 'Return an object and it becomes JSON; return a string and Content-Type is set for you' },
            { title: 'Semantic Errors', desc: 'Built-in helpers like err.notFound() with a unified error response format' },
            { title: 'Declarative Routing', desc: 'Routes are just arrays, so every endpoint is visible at a glance' },
            { title: 'Cross-Runtime', desc: 'The same code runs on Node.js, Bun and Workers' }
        ]
    },
    typeIntegrity: {
        heading: 'Typed from request to response',
        labels: ['Path Params', 'Schema Validation', 'Error Handling', 'Extra Context']
    },
    e2e: {
        heading: 'Types That Sync Automatically',
        description:
            'Define your endpoints on the server and the client gets full type hints automatically: no handwritten types, no code generation.',
        points: ['Automatic type inference', 'Zero-config sync', 'Compile-time checks']
    },
    test: {
        heading: 'Catch Errors Early',
        descriptionHtml:
            'Missing a field or using the wrong type? Your IDE tells you while you write the code, not at runtime. With <code class="text-violet-500 font-mono text-sm">@vafast/api-client</code>, your tests get full type inference too.'
    },
    deploy: {
        heading: 'Write Once, Run Anywhere',
        description:
            'Built on the standard Web Fetch API and not tied to any runtime. The same code deploys to Node.js, Bun, Cloudflare Workers and more.'
    },
    sponsor: {
        heading: 'Made Possible by You',
        description: "Vafast isn't owned by any organization; it's driven by the community. Your support keeps Vafast growing.",
        cta: 'Become a Sponsor',
        thanks: 'Thank you for making Vafast possible'
    },
    future: {
        heading: 'Ready to Start?',
        description: 'Set up your first Vafast project in minutes and experience productive API development',
        getStarted: 'Get Started',
        tutorial: 'Tutorial'
    },
    footer: {
        tagline: '- A high-performance TypeScript web framework'
    }
}

export default en
