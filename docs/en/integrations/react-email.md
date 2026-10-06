---
title: React Email Integration - Vafast
description: 'Guide to integrating Vafast with React Email: write type-safe email template components, configure an email service, send emails from Vafast routes and use an email queue.'
---

# React Email Integration

Vafast integrates seamlessly with React Email, giving you type-safe email templates and powerful email sending.

## Installing Dependencies

```bash
# npm
npm install react-email @react-email/components @react-email/render
npm install -D @types/nodemailer nodemailer

# or with bun
npm install react-email @react-email/components @react-email/render
npm install -D @types/nodemailer nodemailer
```

## Email Template Components

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
    <Preview>Welcome to our platform!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          width="170"
          height="50"
          alt="Logo"
          style={logo}
        />
        <Heading style={h1}>Welcome, {userFirstname}!</Heading>
        <Text style={heroText}>
          Thanks for signing up for our platform. We're glad to have you!
        </Text>
        <Section style={codeBox}>
          <Text style={verificationCodeText}>
            Please click the button below to verify your email address:
          </Text>
          <Link href={verificationUrl} style={button}>
            Verify email
          </Link>
        </Section>
        <Text style={text}>
          If you didn't sign up for our platform, please ignore this email.
        </Text>
        <Text style={footer}>
          This email was sent to {userEmail}
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
    <Preview>Reset your password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          width="170"
          height="50"
          alt="Logo"
          style={logo}
        />
        <Heading style={h1}>Password reset request</Heading>
        <Text style={heroText}>
          Hi {userFirstname}, we received a request to reset your password.
        </Text>
        <Section style={codeBox}>
          <Text style={verificationCodeText}>
            Click the button below to reset your password:
          </Text>
          <Link href={resetUrl} style={button}>
            Reset password
          </Link>
        </Section>
        <Text style={text}>
          This link expires in {expiryTime}. If you didn't request a password reset, please ignore this email.
        </Text>
        <Text style={footer}>
          For your account's security, don't share this link with anyone.
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
          Hi {userFirstname}, {notificationMessage}
        </Text>
        {actionUrl && actionText && (
          <Section style={codeBox}>
            <Link href={actionUrl} style={button}>
              {actionText}
            </Link>
          </Section>
        )}
        <Text style={footer}>
          Thanks for using our platform!
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

## Email Service Configuration

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

  // send the welcome email
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
      subject: 'Welcome to our platform!',
      html
    })
  }

  // send the password reset email
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
      subject: 'Reset your password',
      html
    })
  }

  // send a notification email
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

  // generic email sending method
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

  // verify the email configuration
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

// create the email service instance
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

## Using It in Vafast Routes

::: tip Authentication
Admin email endpoints use `authWithApp` + `requireUser` from [@vafast/auth-middleware](/en/middleware/auth-middleware).
:::

```typescript
// src/routes.ts
import { defineRoute, defineRoutes, err, Type } from 'vafast'
import {
  authWithApp,
  requireUser,
  defineAuthRouteWithApp,
} from '@vafast/auth-middleware'
import { emailService } from './services/emailService'
import { userService } from './services/userService'

export const routes = defineRoutes([
  // user sign-up
  defineRoute({
    method: 'POST',
    path: '/api/auth/register',
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        name: Type.String({ minLength: 1 }),
        password: Type.String({ minLength: 6 })
      })
    },
    handler: async ({ body }) => {
      const { email, name, password } = body
      
      // check whether the user already exists
      const existingUser = await userService.findByEmail(email)
      if (existingUser) {
        throw err.conflict('User already exists')
      }
      
      // create the new user
      const newUser = await userService.create({
        email,
        name,
        password
      })
      
      // generate the verification link
      const verificationToken = generateVerificationToken(newUser.id)
      const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`
      
      // send the welcome email
      try {
        await emailService.sendWelcomeEmail(
          email,
          name,
          verificationUrl
        )
      } catch (error) {
        console.error('Failed to send welcome email:', error)
        // a failed email shouldn't block sign-up
      }
      
      return { 
        user: { 
          id: newUser.id, 
          email: newUser.email, 
          name: newUser.name
        },
        message: 'Registration successful, please check your email to verify your account'
      }
    }
  }),
  
  // password reset request
  defineRoute({
    method: 'POST',
    path: '/api/auth/forgot-password',
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' })
      })
    },
    handler: async ({ body }) => {
      const { email } = body
      
      // find the user
      const user = await userService.findByEmail(email)
      if (!user) {
        // for security, return success even if the user doesn't exist
        return { message: 'If the email exists, a reset link has been sent' }
      }
      
      // generate a reset token
      const resetToken = generateResetToken(user.id)
      const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`
      const expiryTime = '1 hour'
      
      // send the password reset email
      try {
        await emailService.sendPasswordResetEmail(
          email,
          user.name,
          resetUrl,
          expiryTime
        )
        
        return { message: 'A password reset link has been sent to your email' }
      } catch (error) {
        console.error('Failed to send password reset email:', error)
        throw err.internal('Failed to send email, please try again later')
      }
    }
  }),
  
  // send a notification email (requires auth)
  defineAuthRouteWithApp({
    method: 'POST',
    path: '/api/notifications/send-email',
    middleware: [authWithApp, requireUser],
    schema: {
      body: Type.Object({
        userId: Type.String(),
        notificationTitle: Type.String({ minLength: 1 }),
        notificationMessage: Type.String({ minLength: 1 }),
        actionUrl: Type.Optional(Type.String({ format: 'uri' })),
        actionText: Type.Optional(Type.String())
      })
    },
    handler: async ({ body }) => {
      const { userId, notificationTitle, notificationMessage, actionUrl, actionText } = body
      
      const user = await userService.findById(userId)
      if (!user) {
        throw err.notFound('User not found')
      }
      
      try {
        await emailService.sendNotificationEmail(
          user.email,
          user.name,
          notificationTitle,
          notificationMessage,
          actionUrl,
          actionText
        )
        
        return { message: 'Notification email sent successfully' }
      } catch (error) {
        console.error('Failed to send notification email:', error)
        throw err.internal('Failed to send email')
      }
    },
  }),
  
  // send emails in bulk (requires auth)
  defineAuthRouteWithApp({
    method: 'POST',
    path: '/api/notifications/send-bulk-email',
    middleware: [authWithApp, requireUser],
    schema: {
      body: Type.Object({
        userIds: Type.Array(Type.String()),
        notificationTitle: Type.String({ minLength: 1 }),
        notificationMessage: Type.String({ minLength: 1 }),
        actionUrl: Type.Optional(Type.String({ format: 'uri' })),
        actionText: Type.Optional(Type.String())
      })
    },
    handler: async ({ body }) => {
      const { userIds, notificationTitle, notificationMessage, actionUrl, actionText } = body
      
      // get all user info
      const users = await Promise.all(
        userIds.map(id => userService.findById(id))
      )
      
      const validUsers = users.filter(user => user !== null)
      
      // send emails in bulk
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
        message: `Bulk email sending completed`,
        total: validUsers.length,
        successful,
        failed
      }
    },
  })
])
```

## Email Queue System

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

  // add an email job to the queue
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

  // process the queue
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
    
    // keep processing if there are more jobs
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 1000)
    }
  }

  // process a single email job
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
      
      // retry logic
      if (job.retries < job.maxRetries) {
        job.retries++
        this.queue.push(job)
        this.sortQueue()
      } else {
        console.error(`Email job ${job.id} failed after ${job.maxRetries} retries`)
      }
    }
  }

  // sort the queue by priority
  private sortQueue() {
    const priorityOrder = { high: 3, normal: 2, low: 1 }
    this.queue.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
  }

  // get the queue status
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

## Environment Configuration

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

## Testing

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
    expect(emailHtml).toContain('Verify email')
  })
  
  it('should render password reset email correctly', () => {
    const emailHtml = render(
      PasswordResetEmail({
        userFirstname: 'Jane',
        resetUrl: 'https://example.com/reset?token=456',
        expiryTime: '1 hour'
      })
    )
    
    expect(emailHtml).toContain('Jane')
    expect(emailHtml).toContain('Reset password')
    expect(emailHtml).toContain('1 hour')
  })
})
```

## Best Practices

1. **Template design**: use responsive design so emails display correctly on all devices
2. **Type safety**: make full use of TypeScript's type checking
3. **Error handling**: implement solid error handling and retry mechanisms
4. **Queue management**: use a queue system for sending large volumes of email
5. **Test coverage**: write thorough tests for email templates and services
6. **Performance**: use async processing and concurrency control to optimize performance
7. **Security**: avoid including sensitive information in emails

## Related Links

- [Vafast docs](/en/quick-start) - quick start guide
- [React Email docs](https://react.email/docs) - official React Email documentation
- [Middleware system](/en/middleware) - explore available middleware
- [Type validation](/en/patterns/type) - learn about the type validation system
- [Deployment guide](/en/patterns/deploy) - production deployment advice
