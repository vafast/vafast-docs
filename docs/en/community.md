---
title: Community - Vafast
description: 'Join the Vafast community: get help, ask good questions, discuss on GitHub Discussions, contribute code and docs, follow commit conventions and showcase projects.'
---

# Community

Welcome to the Vafast community! We're an open, friendly developer community dedicated to building a high-performance TypeScript web framework.

## Getting Help

### Frequently Asked Questions (FAQ)

Before asking a question, please check our FAQ:

**Q: Which runtimes does Vafast support?**
A: Vafast supports Node.js by default and is also compatible with Bun and any runtime that supports web standards.

**Q: How do I migrate an existing Express/Fastify app?**
A: See our [migration guide](/en/migrate) for detailed migration steps.

**Q: Does it support TypeScript?**
A: Yes! Vafast is written entirely in TypeScript and provides full type safety.

**Q: How does it perform?**
A: Vafast is carefully optimized and performs well on runtimes such as Node.js and Bun, handling high-concurrency workloads.

### Guidelines for Asking Questions

When you need help, please follow these guidelines:

1. **Search existing issues** - check whether a similar question already exists before asking
2. **Provide details** - include error messages, code samples, environment info, etc.
3. **Use a clear title** - describe the problem concisely
4. **Include a minimal reproduction** - it helps pinpoint the problem quickly

### Question Template

```
## Problem Description
[Briefly describe the problem you're running into]

## Environment
- Runtime: [Bun/Node.js/other]
- Version: [exact version]
- Operating system: [OS info]

## Code Sample
```typescript
// your code
```

## Error Message
[The full error stack trace]

## Expected Behavior
[Describe what you expected to happen]

## Actual Behavior
[Describe what actually happened]
```

## Join the Discussion

### Community Channels

#### GitHub Discussions
- **Main discussion platform**: [GitHub Discussions](https://github.com/vafast/vafast/discussions)
- **Feature requests**: share your ideas and suggestions
- **Usage discussions**: discuss best practices and solutions
- **Announcements**: get the latest updates and important notices

#### Discord Server
- **Real-time chat**: [Vafast Discord](https://discord.gg/vafast)
- **Technical discussion**: real-time technical Q&A
- **Showcase**: share your projects
- **Community events**: take part in online events

#### WeChat Group
- **Chinese community**: scan the QR code to join the WeChat group
- **Localized support**: technical discussion in Chinese
- **Collaboration**: find project partners

### Discussion Topics

We welcome discussion on the following topics:

- **Technical questions** - using the framework, best practices, performance tuning
- **Feature suggestions** - new feature proposals and improvement ideas
- **Showcase** - projects built with Vafast
- **Tutorials** - technical articles and video tutorials
- **Community events** - meetups and tech talks

## Contributing Code

### Contribution Guide

We welcome all kinds of contributions! Whether you're an experienced developer or a beginner, you can contribute to the project.

#### Types of Contributions

1. **Code contributions**
   - Bug fixes
   - New features
   - Performance improvements
   - Refactoring

2. **Documentation contributions**
   - Documentation improvements
   - Example code
   - Translations
   - Tutorials

3. **Testing contributions**
   - Unit tests
   - Integration tests
   - Performance tests
   - Improving test coverage

4. **Community contributions**
   - Answering questions
   - Code review
   - Project management
   - Community building

### Development Environment Setup

#### Prerequisites

```bash
# install Bun
curl -fsSL https://bun.sh/install | bash

# clone the repository
git clone https://github.com/vafast/vafast.git
cd vafast

# install dependencies
npm install
```

#### Running Tests

```bash
# run all tests
npm test

# run a specific test
npm test --grep "user"

# run performance tests
npm run test:perf
```

#### Code Style

We use the following tools to ensure code quality:

- **ESLint** - code style checks
- **Prettier** - code formatting
- **TypeScript** - type checking
- **Husky** - Git hooks

```bash
# lint
npm run lint

# format
npm run format

# type check
npm run type-check
```

### Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add a new feature
fix: fix a bug
docs: documentation updates
style: code formatting changes
refactor: code refactoring
test: test-related changes
chore: changes to the build process or auxiliary tools
```

### Pull Request Workflow

1. **Fork the repository** - create your fork
2. **Create a branch** - create a new branch for your feature
3. **Develop** - implement your feature or fix
4. **Run tests** - make sure all tests pass
5. **Commit** - use conventional commit messages
6. **Open a PR** - submit a pull request
7. **Code review** - wait for maintainers to review
8. **Merge** - merged once the review passes

## Showcase

### Featured Projects

Great projects built with Vafast:

#### Personal Blog System
- **Project**: [Vafast Blog](https://github.com/example/vafast-blog)
- **Description**: a modern blog system built on Vafast
- **Features**: Markdown support, comments, SEO optimization

#### E-commerce API
- **Project**: [Vafast Shop](https://github.com/example/vafast-shop)
- **Description**: a complete e-commerce backend API
- **Features**: user management, product management, orders, payment integration

#### Real-time Chat App
- **Project**: [Vafast Chat](https://github.com/example/vafast-chat)
- **Description**: a real-time chat app with WebSocket support
- **Features**: real-time messages, online presence, group chats

### Submit Your Project

If you've built a project with Vafast, we'd love to showcase it:

1. Create a new post in [GitHub Discussions](https://github.com/vafast/vafast/discussions)
2. Use the "Show and Tell" label
3. Include a project description, screenshots, tech stack, etc.
4. Provide the project link and source code

## Learning Resources

### Official Resources

- **Docs**: [docs.vafast.dev](https://docs.vafast.dev)
- **API reference**: [api.vafast.dev](https://api.vafast.dev)
- **Examples**: [examples.vafast.dev](https://examples.vafast.dev)
- **Benchmarks**: [benchmarks.vafast.dev](https://benchmarks.vafast.dev)

### Third-Party Resources

#### Video Tutorials
- **Bilibili**: Vafast getting-started series
- **YouTube**: Vafast Framework Tutorials
- **Tencent Video**: hands-on Vafast development

#### Blog Posts
- **Juejin**: Vafast technical articles
- **CSDN**: Vafast development experience
- **Zhihu**: Vafast technical discussions

#### Open Source Projects
- **GitHub**: search for the "vafast" topic
- **GitLab**: Vafast-related projects
- **Gitee**: mirror projects in China

## Community Events

### Online Events

#### Tech Talks
- **When**: the last Saturday of every month
- **Topics**: rotating technical topics
- **Format**: live stream + interactive discussion
- **Sign up**: [event registration link]

#### Code Review Day
- **When**: every Wednesday evening
- **Content**: open-source code review
- **Participate**: submit code or join the review
- **Rewards**: recognition for outstanding contributors

#### Q&A Hour
- **When**: every Friday afternoon
- **Format**: online Q&A
- **Experts**: framework maintainers and community experts
- **Notes**: Q&A content is compiled into documentation

### Offline Events

#### Meetups
- **Beijing**: monthly tech talks
- **Shanghai**: developer meetups
- **Shenzhen**: startup tech talks
- **Other cities**: organized on demand

#### Conferences
- **Vafast Conf**: annual tech conference
- **JSConf China**: JavaScript conference
- **Node.js developer conferences**: Node.js ecosystem events

## Community Guidelines

### Code of Conduct

We're committed to a friendly, inclusive community:

1. **Respect others** - respect every community member
2. **Constructive discussion** - keep discussions positive and constructive
3. **Inclusiveness** - developers of all backgrounds and experience levels are welcome
4. **Professionalism** - keep technical discussions professional

### Prohibited Behavior

The following is not allowed in the community:

- Personal attacks or insulting language
- Spam or advertising
- Malicious code or exploiting security vulnerabilities
- Content that violates laws or regulations

### Reporting

If you encounter inappropriate behavior:

1. **Message an admin** - contact a community admin privately
2. **Report content** - use the platform's reporting feature
3. **Report by email** - send an email to [community@vafast.dev](mailto:community@vafast.dev)

## Contact

### Official Contact

- **Email**: [hello@vafast.dev](mailto:hello@vafast.dev)
- **Twitter**: [@vafast_dev](https://twitter.com/vafast_dev)
- **GitHub**: [github.com/vafast](https://github.com/vafast)
- **Discord**: [discord.gg/vafast](https://discord.gg/vafast)

### Community Team

- **Tech lead**: [@tech-lead](https://github.com/tech-lead)
- **Community manager**: [@community-manager](https://github.com/community-manager)
- **Docs maintainer**: [@docs-maintainer](https://github.com/docs-maintainer)

### Feedback Channels

- **Feature suggestions**: [GitHub Issues](https://github.com/vafast/vafast/issues)
- **Bug reports**: [Bug Report Template](https://github.com/vafast/vafast/issues/new?template=bug_report.md)
- **Docs feedback**: [Documentation Issues](https://github.com/vafast/vafast/issues?q=label%3Adocumentation)

## Summary

The Vafast community is a vibrant developer community dedicated to:

- ✅ Providing technical support and help
- ✅ Promoting knowledge sharing
- ✅ Encouraging code contributions and participation
- ✅ Organizing tech events and meetups
- ✅ Maintaining a friendly community environment

### Join Us

Whether you're an experienced developer or a beginner, you're welcome in the Vafast community!

- **Join now**: [GitHub Discussions](https://github.com/vafast/vafast/discussions)
- **Real-time chat**: [Discord server](https://discord.gg/vafast)
- **Contribute**: [Contribution guide](https://github.com/vafast/vafast/blob/main/CONTRIBUTING.md)
- **Learn**: [Docs center](/en/at-glance)

Let's build a better web development experience together!
