/**
 * Base Email Layout Template
 * Shared CNEBL-branded layout for all email templates
 * Uses Heritage Diamond theme colors
 */

import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Img,
} from '@react-email/components';
import * as React from 'react';

/**
 * Heritage Diamond theme colors
 */
const colors = {
  leather: '#8B4513',
  navy: '#1B3A5F',
  cream: '#F5F0E1',
  cardinal: '#BE1E2D',
  gold: '#C9A227',
  field: '#2D5A27',
  white: '#FFFFFF',
  grayLight: '#E5E7EB',
  grayDark: '#6B7280',
};

interface BaseLayoutProps {
  /** Preview text shown in email client */
  preview: string;
  /** Main content of the email */
  children: React.ReactNode;
}

/**
 * Base layout component for all CNEBL emails
 * Includes branded header, content area with leather border, and footer
 */
export function BaseLayout({ preview, children }: BaseLayoutProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cnebl.com';

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>CNEBL</Text>
            <Text style={styles.tagline}>Coastal New England Baseball League</Text>
          </Section>

          {/* Main Content */}
          <Section style={styles.content}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Hr style={styles.divider} />

            <Text style={styles.footerLinks}>
              <Link href={baseUrl} style={styles.footerLink}>
                Visit Website
              </Link>
              {' | '}
              <Link href={`${baseUrl}/profile`} style={styles.footerLink}>
                Email Preferences
              </Link>
              {' | '}
              <Link href={`${baseUrl}/contact`} style={styles.footerLink}>
                Contact Us
              </Link>
            </Text>

            <Text style={styles.footerText}>
              Coastal New England Baseball League
            </Text>
            <Text style={styles.footerTextSmall}>
              Adult Men's Baseball - Est. 2024
            </Text>
            <Text style={styles.footerTextSmall}>
              This email was sent by CNEBL. If you have questions, please contact us at{' '}
              <Link href="mailto:info@cnebl.com" style={styles.footerLink}>
                info@cnebl.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/**
 * Button component for email CTAs
 */
interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function EmailButton({ href, children, variant = 'primary' }: EmailButtonProps) {
  const buttonStyle = variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary;

  return (
    <Link href={href} style={buttonStyle}>
      {children}
    </Link>
  );
}

/**
 * Heading component for email sections
 */
interface EmailHeadingProps {
  children: React.ReactNode;
}

export function EmailHeading({ children }: EmailHeadingProps) {
  return <Text style={styles.heading}>{children}</Text>;
}

/**
 * Paragraph component for email body text
 */
interface EmailParagraphProps {
  children: React.ReactNode;
}

export function EmailParagraph({ children }: EmailParagraphProps) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

/**
 * Alert/Notice component for important messages
 */
interface EmailAlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning';
}

export function EmailAlert({ children, variant = 'info' }: EmailAlertProps) {
  const alertStyle = variant === 'warning' ? styles.alertWarning : styles.alertInfo;

  return (
    <Section style={alertStyle}>
      <Text style={styles.alertText}>{children}</Text>
    </Section>
  );
}

/**
 * Inline styles for email components
 * Note: Email clients require inline styles for consistent rendering
 */
const styles = {
  body: {
    backgroundColor: colors.cream,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: '0',
    padding: '40px 20px',
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '0 auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: colors.navy,
    padding: '32px 40px',
    textAlign: 'center' as const,
  },
  logo: {
    color: colors.white,
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '2px',
    margin: '0 0 8px 0',
  },
  tagline: {
    color: colors.gold,
    fontSize: '14px',
    fontWeight: '500',
    letterSpacing: '1px',
    margin: '0',
    textTransform: 'uppercase' as const,
  },
  content: {
    padding: '40px',
    borderLeft: `4px solid ${colors.leather}`,
    margin: '0',
  },
  heading: {
    color: colors.navy,
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.3',
    margin: '0 0 20px 0',
  },
  paragraph: {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  buttonPrimary: {
    backgroundColor: colors.leather,
    borderRadius: '6px',
    color: colors.white,
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    padding: '14px 32px',
    textAlign: 'center' as const,
    textDecoration: 'none',
    marginTop: '16px',
    marginBottom: '16px',
  },
  buttonSecondary: {
    backgroundColor: colors.navy,
    borderRadius: '6px',
    color: colors.white,
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    padding: '14px 32px',
    textAlign: 'center' as const,
    textDecoration: 'none',
    marginTop: '16px',
    marginBottom: '16px',
  },
  alertInfo: {
    backgroundColor: '#EFF6FF',
    borderLeft: `4px solid ${colors.navy}`,
    borderRadius: '4px',
    padding: '16px 20px',
    marginTop: '24px',
    marginBottom: '24px',
  },
  alertWarning: {
    backgroundColor: '#FEF3C7',
    borderLeft: `4px solid ${colors.gold}`,
    borderRadius: '4px',
    padding: '16px 20px',
    marginTop: '24px',
    marginBottom: '24px',
  },
  alertText: {
    color: '#374151',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0',
  },
  footer: {
    padding: '24px 40px 32px',
    textAlign: 'center' as const,
  },
  divider: {
    borderColor: colors.grayLight,
    borderTop: 'none',
    margin: '0 0 24px 0',
  },
  footerLinks: {
    color: colors.grayDark,
    fontSize: '14px',
    margin: '0 0 16px 0',
  },
  footerLink: {
    color: colors.leather,
    textDecoration: 'none',
  },
  footerText: {
    color: colors.grayDark,
    fontSize: '14px',
    fontWeight: '500',
    margin: '0 0 4px 0',
  },
  footerTextSmall: {
    color: colors.grayDark,
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '0 0 8px 0',
  },
};

export default BaseLayout;
