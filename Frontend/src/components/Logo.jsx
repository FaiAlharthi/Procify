import logoUrl from '../assets/procify-logo.png';

function Logo({ width = 150, className = '' }) {
  return (
    <img
      src={logoUrl}
      alt="Procify"
      width={width}
      className={`procify-logo ${className}`.trim()}
      style={{ display: 'block', height: 'auto', mixBlendMode: 'screen' }}
    />
  );
}

export default Logo;
