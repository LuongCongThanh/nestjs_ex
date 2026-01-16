import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly sender: string;
  private readonly resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY for sending emails');
    }
    this.resend = new Resend(apiKey);

    const sender = this.configService.get<string>('MAIL_FROM');
    if (!sender) {
      throw new Error('MAIL_FROM is required for sending emails');
    }
    this.sender = sender;
  }

  async sendVerificationEmail(email: string, firstName: string, token: string) {
    const verifyUrl = this.buildVerifyUrl(token);
    const html = `
      <h1>Welcome ${firstName}!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `;

    try {
      await this.resend.emails.send({
        from: this.sender,
        to: email,
        subject: 'Verify your email',
        html,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}: ${error?.message || error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string) {
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
      await this.resend.emails.send({
        from: this.sender,
        to: email,
        subject: 'Reset your password',
        html,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}: ${error?.message || error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private buildVerifyUrl(token: string): string {
    const baseUrl =
      this.configService.get('BACKEND_URL') ||
      this.configService.get('FRONTEND_URL') ||
      '';
    const apiPrefix = (this.configService.get('API_PREFIX') || 'api/v1').replace(/^\/+|\/+$/g, '');
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const path = 'auth/verify-email';
    const prefixSegment = apiPrefix ? `/${apiPrefix}` : '';
    return `${normalizedBase}${prefixSegment}/${path}?token=${token}`;
  }
}
