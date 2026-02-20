/**
 * Password Reset Template
 * Sent when a user requests to reset their password
 */

import * as React from 'react';
import {
  BaseLayout,
  EmailButton,
  EmailHeading,
  EmailParagraph,
  EmailAlert,
} from '../base-layout';

interface PasswordResetTemplateProps {
  /** User's display name */
  userName: string;
  /** URL to reset the password */
  resetUrl: string;
}

/**
 * Password reset template component
 * Includes reset instructions, button, and security notice
 */
export function PasswordResetTemplate({ userName, resetUrl }: PasswordResetTemplateProps) {
  const previewText = `Reset your CNEBL password`;

  return (
    <BaseLayout preview={previewText}>
      <EmailHeading>Reset Your Password</EmailHeading>

      <EmailParagraph>
        Hi {userName},
      </EmailParagraph>

      <EmailParagraph>
        We received a request to reset the password for your CNEBL account.
        Click the button below to create a new password.
      </EmailParagraph>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={resetUrl}>
          Reset Password
        </EmailButton>
      </div>

      <EmailParagraph>
        Or copy and paste this link into your browser:
      </EmailParagraph>

      <div style={styles.urlBox}>
        <code style={styles.urlText}>{resetUrl}</code>
      </div>

      <EmailAlert variant="warning">
        This password reset link will expire in 1 hour for security reasons.
        If you did not request a password reset, please ignore this email or
        contact us if you have concerns about your account security.
      </EmailAlert>

      <EmailParagraph>
        <strong>Security Tips:</strong>
      </EmailParagraph>

      <ul style={styles.list}>
        <li style={styles.listItem}>Never share your password with anyone</li>
        <li style={styles.listItem}>Use a unique password for your CNEBL account</li>
        <li style={styles.listItem}>Choose a strong password with letters, numbers, and symbols</li>
      </ul>

      <EmailParagraph>
        If you're having trouble, reply to this email and we'll help you out.
        <br />
        <strong style={{ color: '#1B3A5F' }}>The CNEBL Team</strong>
      </EmailParagraph>
    </BaseLayout>
  );
}

const styles = {
  urlBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: '4px',
    padding: '12px 16px',
    marginBottom: '24px',
    overflowX: 'auto' as const,
  },
  urlText: {
    color: '#374151',
    fontSize: '12px',
    wordBreak: 'break-all' as const,
  },
  list: {
    color: '#374151',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    paddingLeft: '20px',
  },
  listItem: {
    marginBottom: '8px',
  },
};

export default PasswordResetTemplate;
