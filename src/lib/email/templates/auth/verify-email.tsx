/**
 * Email Verification Template
 * Sent when a new user registers to verify their email address
 */

import * as React from 'react';
import {
  BaseLayout,
  EmailButton,
  EmailHeading,
  EmailParagraph,
  EmailAlert,
} from '../base-layout';

interface VerifyEmailTemplateProps {
  /** User's display name */
  userName: string;
  /** URL to verify the email address */
  verifyUrl: string;
}

/**
 * Email verification template component
 * Includes welcome message, verify button, and security notice
 */
export function VerifyEmailTemplate({ userName, verifyUrl }: VerifyEmailTemplateProps) {
  const previewText = `Welcome to CNEBL! Please verify your email address.`;

  return (
    <BaseLayout preview={previewText}>
      <EmailHeading>Welcome to CNEBL, {userName}!</EmailHeading>

      <EmailParagraph>
        Thanks for signing up for the Coastal New England Baseball League.
        To complete your registration and access your account, please verify
        your email address by clicking the button below.
      </EmailParagraph>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={verifyUrl}>
          Verify Email Address
        </EmailButton>
      </div>

      <EmailParagraph>
        Or copy and paste this link into your browser:
      </EmailParagraph>

      <div style={styles.urlBox}>
        <code style={styles.urlText}>{verifyUrl}</code>
      </div>

      <EmailAlert variant="warning">
        This verification link will expire in 24 hours. If you did not create
        an account with CNEBL, you can safely ignore this email.
      </EmailAlert>

      <EmailParagraph>
        We're excited to have you join our league! Once verified, you'll be
        able to view schedules, check stats, and stay connected with your team.
      </EmailParagraph>

      <EmailParagraph>
        See you on the diamond!
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
};

export default VerifyEmailTemplate;
