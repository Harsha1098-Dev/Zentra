import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SentEmail {
  to: string;
  subject: string;
  token?: string;
  link?: string;
  content: string;
  sentAt: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  public sentEmails: SentEmail[] = [];

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(to: string, token: string, firstName?: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const link = `${frontendUrl}/verify-email?token=${token}`;
    const subject = 'Verify your Zentra account email';
    const content = `Hello ${firstName || 'there'},\n\nPlease verify your email by clicking the link below:\n${link}\n\nThis link will expire in 24 hours.`;

    this.logger.log(`[EMAIL DISPATCH] To: ${to} | Subject: "${subject}" | Verification Link: ${link}`);
    this.sentEmails.push({ to, subject, token, link, content, sentAt: new Date() });
  }

  async sendInvitationEmail(
    to: string,
    token: string,
    orgName: string,
    roleName: string,
    inviterName: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const link = `${frontendUrl}/invite/accept?token=${token}`;
    const subject = `You've been invited to join ${orgName} on Zentra`;
    const content = `Hello,\n\n${inviterName} has invited you to join ${orgName} as a ${roleName}.\n\nClick the link below to accept your invitation:\n${link}\n\nThis invitation expires in 7 days.`;

    this.logger.log(`[EMAIL DISPATCH] To: ${to} | Subject: "${subject}" | Accept Link: ${link}`);
    this.sentEmails.push({ to, subject, token, link, content, sentAt: new Date() });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const link = `${frontendUrl}/reset-password?token=${token}`;
    const subject = 'Reset your Zentra password';
    const content = `Hello,\n\nWe received a request to reset your password. Use the link below to set a new password:\n${link}\n\nThis link expires in 1 hour.`;

    this.logger.log(`[EMAIL DISPATCH] To: ${to} | Subject: "${subject}" | Reset Link: ${link}`);
    this.sentEmails.push({ to, subject, token, link, content, sentAt: new Date() });
  }

  async sendNotification(to: string, subject: string, content: string): Promise<void> {
    this.logger.log(`[NOTIFICATION DISPATCH] To: ${to} | Subject: "${subject}"`);
    this.sentEmails.push({ to, subject, content, sentAt: new Date() });
  }

  getLastEmailFor(email: string): SentEmail | undefined {
    return this.sentEmails
      .filter((e) => e.to.toLowerCase() === email.toLowerCase())
      .slice(-1)[0];
  }

  clearEmails(): void {
    this.sentEmails = [];
  }
}
