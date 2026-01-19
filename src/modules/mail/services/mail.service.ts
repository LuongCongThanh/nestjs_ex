import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly sender: string;
  private isTestAccount = false;

  constructor(private configService: ConfigService) {
    this.sender = this.configService.get<string>('MAIL_FROM') || 'noreply@example.com';
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');

    if (!user || user === 'your_mailtrap_username' || !pass || pass === 'your_mailtrap_password') {
      this.logger.warn('SMTP credentials are not configured or still using placeholders. Creating a test account...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.isTestAccount = true;
        this.logger.log(`Created auto-test account: ${testAccount.user}`);
      } catch (error) {
        this.logger.error('Failed to create test account:', error);
        throw error;
      }
    } else {
      const host = this.configService.get<string>('MAIL_HOST');
      const port = this.configService.get<number>('MAIL_PORT');
      const secure = this.configService.get<boolean>('MAIL_SECURE', false);

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    }

    return this.transporter;
  }

  async sendVerificationEmail(email: string, firstName: string, token: string) {
    const transporter = await this.getTransporter();
    const verifyUrl = this.buildVerifyUrl(token);
    const html = `
      <h1>Welcome ${firstName}!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `;

    try {
      const info = await transporter.sendMail({
        from: this.isTestAccount ? '"Ethereal Test" <noreply@ethereal.email>' : this.sender,
        to: email,
        subject: 'Verify your email',
        html,
      });

      this.logger.log(`Verification email sent to ${email}. MessageId: ${info.messageId}`);
      if (this.isTestAccount) {
        this.logger.log(`PREVIEW URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}: ${error?.message || error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string) {
    const transporter = await this.getTransporter();
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>Hello ${firstName},</p>
      <p>You requested to reset your password. Click the link below to set a new one:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    try {
      const info = await transporter.sendMail({
        from: this.isTestAccount ? '"Ethereal Test" <noreply@ethereal.email>' : this.sender,
        to: email,
        subject: 'Reset your password',
        html,
      });

      this.logger.log(`Password reset email sent to ${email}. MessageId: ${info.messageId}`);
      if (this.isTestAccount) {
        this.logger.log(`PREVIEW URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}: ${error?.message || error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private buildVerifyUrl(token: string): string {
    const baseUrl = this.configService.get('BACKEND_URL') || `http://localhost:${this.configService.get('PORT', 3000)}`;
    const apiPrefix = (this.configService.get('API_PREFIX') || 'api/v1').replace(/^\/+|\/+$/g, '');
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const path = 'auth/verify-email';
    const prefixSegment = apiPrefix ? `/${apiPrefix}` : '';
    return `${normalizedBase}${prefixSegment}/${path}?token=${token}`;
  }
}
