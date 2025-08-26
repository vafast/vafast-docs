---
title: React Email 集成 - Vafast
---

# React Email 集成

Vafast 可以与 React Email 无缝集成，为您提供类型安全的邮件模板和强大的邮件发送功能。

## 安装依赖

```bash
bun add react-email @react-email/components @react-email/render
bun add -D @types/nodemailer nodemailer
```

## 邮件模板组件

```tsx
// src/emails/WelcomeEmail.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
  userFirstname: string
  userEmail: string
  verificationUrl: string
}

export const WelcomeEmail = ({
  userFirstname,
  userEmail,
  verificationUrl
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>欢迎加入我们的平台！</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          width="170"
          height="50"
          alt="Logo"
          style={logo}
        />
        <Heading style={h1}>欢迎，{userFirstname}！</Heading>
        <Text style={heroText}>
          感谢您注册我们的平台。我们很高兴您能加入我们！
        </Text>
        <Section style={codeBox}>
          <Text style={verificationCodeText}>
            请点击下面的按钮验证您的邮箱地址：
          </Text>
          <Link href={verificationUrl} style={button}>
            验证邮箱
          </Link>
        </Section>
        <Text style={text}>
          如果您没有注册我们的平台，请忽略此邮件。
        </Text>
        <Text style={footer}>
          此邮件发送给 {userEmail}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px'
}

const logo = {
  margin: '0 auto'
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0'
}

const heroText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0'
}

const codeBox = {
  background: 'rgb(245, 244, 245)',
  borderRadius: '4px',
  margin: '16px auto 14px',
  verticalAlign: 'middle',
  width: '280px'
}

const verificationCodeText = {
  color: '#333',
  display: 'inline',
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '24px',
  textAlign: 'center' as const
}

const button = {
  backgroundColor: '#000',
  borderRadius: '4px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '50px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  textTransform: 'uppercase',
  width: '100%',
  marginTop: '16px'
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px'
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px'
}
```

```tsx
// src/emails/PasswordResetEmail.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components'
import * as React from 'react'

interface PasswordResetEmailProps {
  userFirstname: string
  resetUrl: string
  expiryTime: string
}

export const PasswordResetEmail = ({
  userFirstname,
  resetUrl,
  expiryTime
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>重置您的密码</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          width="170"
          height="50"
          alt="Logo"
          style={logo}
        />
        <Heading style={h1}>密码重置请求</Heading>
        <Text style={heroText}>
          您好 {userFirstname}，我们收到了您的密码重置请求。
        </Text>
        <Section style={codeBox}>
          <Text style={verificationCodeText}>
            点击下面的按钮重置您的密码：
          </Text>
          <Link href={resetUrl} style={button}>
            重置密码
          </Link>
        </Section>
        <Text style={text}>
          此链接将在 {expiryTime} 后过期。如果您没有请求重置密码，请忽略此邮件。
        </Text>
        <Text style={footer}>
          为了您的账户安全，请勿将此链接分享给他人。
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px'
}

const logo = {
  margin: '0 auto'
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0'
}

const heroText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0'
}

const codeBox = {
  background: 'rgb(245, 244, 245)',
  borderRadius: '4px',
  margin: '16px auto 14px',
  verticalAlign: 'middle',
  width: '280px'
}

const verificationCodeText = {
  color: '#333',
  display: 'inline',
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '24px',
  textAlign: 'center' as const
}

const button = {
  backgroundColor: '#dc3545',
  borderRadius: '4px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '50px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  textTransform: 'uppercase',
  width: '100%',
  marginTop: '16px'
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px'
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px'
}
```

```tsx
// src/emails/NotificationEmail.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components'
import * as React from 'react'

interface NotificationEmailProps {
  userFirstname: string
  notificationTitle: string
  notificationMessage: string
  actionUrl?: string
  actionText?: string
}

export const NotificationEmail = ({
  userFirstname,
  notificationTitle,
  notificationMessage,
  actionUrl,
  actionText
}: NotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>{notificationTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          width="170"
          height="50"
          alt="Logo"
          style={logo}
        />
        <Heading style={h1}>{notificationTitle}</Heading>
        <Text style={heroText}>
          您好 {userFirstname}，{notificationMessage}
        </Text>
        {actionUrl && actionText && (
          <Section style={codeBox}>
            <Link href={actionUrl} style={button}>
              {actionText}
            </Link>
          </Section>
        )}
        <Text style={footer}>
          感谢您使用我们的平台！
        </Text>
      </Container>
    </Body>
  </Html>
)

export default NotificationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px'
}

const logo = {
  margin: '0 auto'
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0'
}

const heroText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0'
}

const codeBox = {
  background: 'rgb(245, 244, 245)',
  borderRadius: '4px',
  margin: '16px auto 14px',
  verticalAlign: 'middle',
  width: '280px'
}

const button = {
  backgroundColor: '#007bff',
  borderRadius: '4px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '50px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  textTransform: 'uppercase',
  width: '100%'
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px'
}
```

## 邮件服务配置

```typescript
// src/services/emailService.ts
import nodemailer from 'nodemailer'
import { render } from '@react-email/render'
import WelcomeEmail from '../emails/WelcomeEmail'
import PasswordResetEmail from '../emails/PasswordResetEmail'
import NotificationEmail from '../emails/NotificationEmail'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config)
  }

  // 发送欢迎邮件
  async sendWelcomeEmail(
    to: string,
    userFirstname: string,
    verificationUrl: string
  ) {
    const html = render(
      WelcomeEmail({
        userFirstname,
        userEmail: to,
        verificationUrl
      })
    )

    return await this.sendEmail({
      to,
      subject: '欢迎加入我们的平台！',
      html
    })
  }

  // 发送密码重置邮件
  async sendPasswordResetEmail(
    to: string,
    userFirstname: string,
    resetUrl: string,
    expiryTime: string
  ) {
    const html = render(
      PasswordResetEmail({
        userFirstname,
        resetUrl,
        expiryTime
      })
    )

    return await this.sendEmail({
      to,
      subject: '重置您的密码',
      html
    })
  }

  // 发送通知邮件
  async sendNotificationEmail(
    to: string,
    userFirstname: string,
    notificationTitle: string,
    notificationMessage: string,
    actionUrl?: string,
    actionText?: string
  ) {
    const html = render(
      NotificationEmail({
        userFirstname,
        notificationTitle,
        notificationMessage,
        actionUrl,
        actionText
      })
    )

    return await this.sendEmail({
      to,
      subject: notificationTitle,
      html
    })
  }

  // 通用邮件发送方法
  private async sendEmail(options: EmailOptions) {
    const mailOptions = {
      from: options.from || process.env.EMAIL_FROM || 'noreply@example.com',
      to: options.to,
      subject: options.subject,
      html: options.html
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', info.messageId)
      return info
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  // 验证邮件配置
  async verifyConnection() {
    try {
      await this.transporter.verify()
      console.log('Email service is ready')
      return true
    } catch (error) {
      console.error('Email service verification failed:', error)
      return false
    }
  }
}

// 创建邮件服务实例
export const emailService = new EmailService({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
})
```

## 在 Vafast 路由中使用

```typescript
// src/routes.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'
import { emailService } from './services/emailService'
import { userService } from './services/userService'
import { authMiddleware } from './middleware/auth'

export const routes = defineRoutes([
  // 用户注册
  {
    method: 'POST',
    path: '/api/auth/register',
    handler: createRouteHandler(async ({ body }) => {
      const { email, name, password } = body
      
      // 检查用户是否已存在
      const existingUser = await userService.findByEmail(email)
      if (existingUser) {
        return { error: '用户已存在' }, { status: 400 }
      }
      
      // 创建新用户
      const newUser = await userService.create({
        email,
        name,
        password
      })
      
      // 生成验证链接
      const verificationToken = generateVerificationToken(newUser.id)
      const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`
      
      // 发送欢迎邮件
      try {
        await emailService.sendWelcomeEmail(
          email,
          name,
          verificationUrl
        )
      } catch (error) {
        console.error('Failed to send welcome email:', error)
        // 邮件发送失败不应该阻止用户注册
      }
      
      return { 
        user: { 
          id: newUser.id, 
          email: newUser.email, 
          name: newUser.name
        },
        message: '注册成功，请检查您的邮箱进行验证'
      }
    }),
    body: Type.Object({
      email: Type.String({ format: 'email' }),
      name: Type.String({ minLength: 1 }),
      password: Type.String({ minLength: 6 })
    })
  },
  
  // 密码重置请求
  {
    method: 'POST',
    path: '/api/auth/forgot-password',
    handler: createRouteHandler(async ({ body }) => {
      const { email } = body
      
      // 查找用户
      const user = await userService.findByEmail(email)
      if (!user) {
        // 为了安全，即使用户不存在也返回成功
        return { message: '如果邮箱存在，重置链接已发送' }
      }
      
      // 生成重置令牌
      const resetToken = generateResetToken(user.id)
      const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`
      const expiryTime = '1小时'
      
      // 发送密码重置邮件
      try {
        await emailService.sendPasswordResetEmail(
          email,
          user.name,
          resetUrl,
          expiryTime
        )
        
        return { message: '密码重置链接已发送到您的邮箱' }
      } catch (error) {
        console.error('Failed to send password reset email:', error)
        return { error: '邮件发送失败，请稍后重试' }, { status: 500 }
      }
    }),
    body: Type.Object({
      email: Type.String({ format: 'email' })
    })
  },
  
  // 发送通知邮件
  {
    method: 'POST',
    path: '/api/notifications/send-email',
    handler: createRouteHandler(async ({ body, request }) => {
      // 这里应该验证用户身份和权限
      const { userId, notificationTitle, notificationMessage, actionUrl, actionText } = body
      
      // 获取用户信息
      const user = await userService.findById(userId)
      if (!user) {
        return { error: '用户不存在' }, { status: 404 }
      }
      
      // 发送通知邮件
      try {
        await emailService.sendNotificationEmail(
          user.email,
          user.name,
          notificationTitle,
          notificationMessage,
          actionUrl,
          actionText
        )
        
        return { message: '通知邮件发送成功' }
      } catch (error) {
        console.error('Failed to send notification email:', error)
        return { error: '邮件发送失败' }, { status: 500 }
      }
    }),
    body: Type.Object({
      userId: Type.String(),
      notificationTitle: Type.String({ minLength: 1 }),
      notificationMessage: Type.String({ minLength: 1 }),
      actionUrl: Type.Optional(Type.String({ format: 'uri' })),
      actionText: Type.Optional(Type.String())
    }),
    middleware: [authMiddleware]
  },
  
  // 批量发送邮件
  {
    method: 'POST',
    path: '/api/notifications/send-bulk-email',
    handler: createRouteHandler(async ({ body }) => {
      const { userIds, notificationTitle, notificationMessage, actionUrl, actionText } = body
      
      // 获取所有用户信息
      const users = await Promise.all(
        userIds.map(id => userService.findById(id))
      )
      
      const validUsers = users.filter(user => user !== null)
      
      // 批量发送邮件
      const results = await Promise.allSettled(
        validUsers.map(user =>
          emailService.sendNotificationEmail(
            user!.email,
            user!.name,
            notificationTitle,
            notificationMessage,
            actionUrl,
            actionText
          )
        )
      )
      
      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.filter(result => result.status === 'rejected').length
      
      return {
        message: `批量邮件发送完成`,
        total: validUsers.length,
        successful,
        failed
      }
    }),
    body: Type.Object({
      userIds: Type.Array(Type.String()),
      notificationTitle: Type.String({ minLength: 1 }),
      notificationMessage: Type.String({ minLength: 1 }),
      actionUrl: Type.Optional(Type.String({ format: 'uri' })),
      actionText: Type.Optional(Type.String())
    }),
    middleware: [authMiddleware]
  }
])
```

## 邮件队列系统

```typescript
// src/services/emailQueueService.ts
import { emailService } from './emailService'

interface EmailJob {
  id: string
  type: 'welcome' | 'password-reset' | 'notification'
  data: any
  priority: 'high' | 'normal' | 'low'
  retries: number
  maxRetries: number
}

export class EmailQueueService {
  private queue: EmailJob[] = []
  private processing = false
  private maxConcurrent = 5
  private currentProcessing = 0

  // 添加邮件任务到队列
  async addToQueue(job: Omit<EmailJob, 'id' | 'retries'>) {
    const emailJob: EmailJob = {
      ...job,
      id: crypto.randomUUID(),
      retries: 0
    }
    
    this.queue.push(emailJob)
    this.sortQueue()
    
    if (!this.processing) {
      this.processQueue()
    }
  }

  // 处理队列
  private async processQueue() {
    if (this.processing || this.currentProcessing >= this.maxConcurrent) {
      return
    }
    
    this.processing = true
    
    while (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
      const job = this.queue.shift()
      if (job) {
        this.currentProcessing++
        this.processJob(job).finally(() => {
          this.currentProcessing--
        })
      }
    }
    
    this.processing = false
    
    // 如果还有任务，继续处理
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 1000)
    }
  }

  // 处理单个邮件任务
  private async processJob(job: EmailJob) {
    try {
      switch (job.type) {
        case 'welcome':
          await emailService.sendWelcomeEmail(
            job.data.to,
            job.data.userFirstname,
            job.data.verificationUrl
          )
          break
          
        case 'password-reset':
          await emailService.sendPasswordResetEmail(
            job.data.to,
            job.data.userFirstname,
            job.data.resetUrl,
            job.data.expiryTime
          )
          break
          
        case 'notification':
          await emailService.sendNotificationEmail(
            job.data.to,
            job.data.userFirstname,
            job.data.notificationTitle,
            job.data.notificationMessage,
            job.data.actionUrl,
            job.data.actionText
          )
          break
      }
      
      console.log(`Email job ${job.id} completed successfully`)
    } catch (error) {
      console.error(`Email job ${job.id} failed:`, error)
      
      // 重试逻辑
      if (job.retries < job.maxRetries) {
        job.retries++
        this.queue.push(job)
        this.sortQueue()
      } else {
        console.error(`Email job ${job.id} failed after ${job.maxRetries} retries`)
      }
    }
  }

  // 按优先级排序队列
  private sortQueue() {
    const priorityOrder = { high: 3, normal: 2, low: 1 }
    this.queue.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
  }

  // 获取队列状态
  getQueueStatus() {
    return {
      total: this.queue.length,
      processing: this.currentProcessing,
      maxConcurrent: this.maxConcurrent
    }
  }
}

export const emailQueueService = new EmailQueueService()
```

## 环境配置

```env
# .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
APP_URL=http://localhost:3000
```

## 测试

```typescript
// src/services/__tests__/emailService.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { render } from '@react-email/render'
import WelcomeEmail from '../../emails/WelcomeEmail'
import PasswordResetEmail from '../../emails/PasswordResetEmail'

describe('Email Templates', () => {
  it('should render welcome email correctly', () => {
    const emailHtml = render(
      WelcomeEmail({
        userFirstname: 'John',
        userEmail: 'john@example.com',
        verificationUrl: 'https://example.com/verify?token=123'
      })
    )
    
    expect(emailHtml).toContain('John')
    expect(emailHtml).toContain('john@example.com')
    expect(emailHtml).toContain('验证邮箱')
  })
  
  it('should render password reset email correctly', () => {
    const emailHtml = render(
      PasswordResetEmail({
        userFirstname: 'Jane',
        resetUrl: 'https://example.com/reset?token=456',
        expiryTime: '1小时'
      })
    )
    
    expect(emailHtml).toContain('Jane')
    expect(emailHtml).toContain('重置密码')
    expect(emailHtml).toContain('1小时')
  })
})
```

## 最佳实践

1. **模板设计**：使用响应式设计确保邮件在不同设备上正常显示
2. **类型安全**：充分利用 TypeScript 的类型检查功能
3. **错误处理**：实现完善的错误处理和重试机制
4. **队列管理**：使用队列系统处理大量邮件发送
5. **测试覆盖**：为邮件模板和服务编写完整的测试
6. **性能优化**：使用异步处理和并发控制优化性能
7. **安全考虑**：避免在邮件中包含敏感信息

## 相关链接

- [Vafast 文档](/getting-started/quickstart) - 快速开始指南
- [React Email 文档](https://react.email/docs) - React Email 官方文档
- [中间件系统](/middleware) - 探索可用的中间件
- [类型验证](/patterns/type) - 了解类型验证系统
- [部署指南](/patterns/deploy) - 生产环境部署建议
