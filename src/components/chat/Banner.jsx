import { useTheme } from '../../contexts/ThemeContext';

export const Banner = () => {
  const { mode } = useTheme();
  const bannerSrc = mode === 'light' ? '/blankspace-banner-light.png' : '/blankspace-banner.png';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <img
        src={bannerSrc}
        alt="BlankSpace"
        style={{
          height: '48px',
          width: 'auto',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export default Banner;
