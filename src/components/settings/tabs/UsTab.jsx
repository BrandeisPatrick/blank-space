import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme } from '../../../styles/theme';
import {
  LinkedInIcon,
  TwitterXIcon as XIcon,
  InstagramIcon,
  GitHubIcon,
} from '../../icons/icons';

export const UsTab = () => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
    }}>
      <div style={{
        textAlign: 'center',
      }}>
        <h3 style={{
          margin: `0 0 ${theme.spacing.sm} 0`,
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          fontFamily: theme.typography.fontFamily.sans,
          color: theme.colors.text.primary,
        }}>
          Blank Space
        </h3>
        <p style={{
          margin: 0,
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          fontFamily: theme.typography.fontFamily.sans,
        }}>
          Open source AI app builder
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: theme.spacing.xl,
      }}>
        <a
          href="https://www.linkedin.com/in/patrick-pinyuan-li/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover-linkedin hover-transition"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing.xs,
            textDecoration: 'none',
            color: theme.colors.text.secondary,
          }}
        >
          <LinkedInIcon size={28} color="currentColor" />
          <span style={{ fontSize: theme.typography.fontSize.xs }}>LinkedIn</span>
        </a>

        <a
          href="https://x.com/BrandeisPatrick"
          target="_blank"
          rel="noopener noreferrer"
          className={`hover-text-primary-${mode} hover-transition`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing.xs,
            textDecoration: 'none',
            color: theme.colors.text.secondary,
          }}
        >
          <XIcon size={28} color="currentColor" />
          <span style={{ fontSize: theme.typography.fontSize.xs }}>X</span>
        </a>

        <a
          href="https://www.instagram.com/blankspace_build/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover-instagram hover-transition"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing.xs,
            textDecoration: 'none',
            color: theme.colors.text.secondary,
          }}
        >
          <InstagramIcon size={28} color="currentColor" />
          <span style={{ fontSize: theme.typography.fontSize.xs }}>Instagram</span>
        </a>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing.sm,
      }}>
        <span style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
        }}>
          Open sourced at GitHub
        </span>
        <a
          href="https://github.com/BrandeisPatrick/blank-space"
          target="_blank"
          rel="noopener noreferrer"
          className={`hover-text-primary-${mode} hover-transition`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing.xs,
            textDecoration: 'none',
            color: theme.colors.text.secondary,
          }}
        >
          <GitHubIcon size={28} color="currentColor" />
          <span style={{ fontSize: theme.typography.fontSize.xs }}>GitHub</span>
        </a>
      </div>
    </div>
  );
};

export default UsTab;
