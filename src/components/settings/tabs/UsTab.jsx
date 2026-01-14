import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme } from '../../../styles/theme';
import {
  LinkedInIcon,
  TwitterXIcon as XIcon,
  InstagramIcon,
  GitHubIcon,
  DiscordIcon,
} from '../../icons/icons';

export const UsTab = () => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  const colors = {
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    separator: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  };

  const SectionTitle = ({ children }) => (
    <h3 style={{
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: colors.textPrimary,
      fontFamily: theme.typography.fontFamily.sans,
      margin: 0,
      marginBottom: theme.spacing.lg,
    }}>
      {children}
    </h3>
  );

  const Separator = () => (
    <div style={{
      height: '1px',
      background: colors.separator,
      margin: `${theme.spacing.xl} 0`,
    }} />
  );

  const SocialLink = ({ href, icon: Icon, label, hoverClass }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${hoverClass} hover-transition`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing.xs,
        textDecoration: 'none',
        color: colors.textSecondary,
      }}
    >
      <Icon size={28} color="currentColor" />
      <span style={{
        fontSize: theme.typography.fontSize.xs,
        fontFamily: theme.typography.fontFamily.sans,
      }}>
        {label}
      </span>
    </a>
  );

  return (
    <div style={{ padding: `${theme.spacing.md} 0` }}>
      {/* Social Media Section */}
      <div style={{ paddingBottom: theme.spacing.lg }}>
        <SectionTitle>Social Media</SectionTitle>
        <div style={{
          display: 'flex',
          gap: theme.spacing['3xl'],
        }}>
          <SocialLink
            href="https://x.com/BrandeisPatrick"
            icon={XIcon}
            label="X"
            hoverClass={`hover-text-primary-${mode}`}
          />
          <SocialLink
            href="https://www.instagram.com/blankspace_build/"
            icon={InstagramIcon}
            label="Instagram"
            hoverClass="hover-instagram"
          />
          <SocialLink
            href="https://discord.gg/BDhsyw59"
            icon={DiscordIcon}
            label="Discord"
            hoverClass="hover-discord"
          />
        </div>
      </div>

      <Separator />

      {/* Open Source Section */}
      <div>
        <SectionTitle>Open Source</SectionTitle>
        <p style={{
          margin: 0,
          marginBottom: theme.spacing.lg,
          fontSize: theme.typography.fontSize.sm,
          color: colors.textSecondary,
          fontFamily: theme.typography.fontFamily.sans,
        }}>
          Blank Space is open sourced on GitHub
        </p>
        <div style={{
          display: 'flex',
          gap: theme.spacing['3xl'],
        }}>
          <SocialLink
            href="https://github.com/BrandeisPatrick/blank-space"
            icon={GitHubIcon}
            label="GitHub"
            hoverClass={`hover-text-primary-${mode}`}
          />
          <SocialLink
            href="https://www.linkedin.com/in/patrick-pinyuan-li/"
            icon={LinkedInIcon}
            label="LinkedIn"
            hoverClass="hover-linkedin"
          />
        </div>
      </div>
    </div>
  );
};

export default UsTab;
