export const PLATFORM_BRAND = {
  name: 'HoneyPot',
  logo: `${process.env.PUBLIC_URL || ''}/honeypot-icon.png`,
  primaryColor: '#D89A00',
};

export const canUseTenantBranding = (account) => (
  Boolean(account?.tenant) && account.role !== 'superadmin'
);

const hexToRgb = (hex) => {
  const clean = typeof hex === 'string' && hex.startsWith('#') ? hex : PLATFORM_BRAND.primaryColor;
  return {
    r: parseInt(clean.slice(1, 3), 16),
    g: parseInt(clean.slice(3, 5), 16),
    b: parseInt(clean.slice(5, 7), 16),
  };
};

const darken = (hex, amount = 25) => {
  const { r, g, b } = hexToRgb(hex);
  return '#' + [r, g, b]
    .map((value) => Math.max(0, value - amount).toString(16).padStart(2, '0'))
    .join('');
};

export const applyBrandColor = (color = PLATFORM_BRAND.primaryColor) => {
  const primary = typeof color === 'string' && color.startsWith('#') ? color : PLATFORM_BRAND.primaryColor;
  const hover = darken(primary);
  const { r, g, b } = hexToRgb(primary);
  const gradient = `linear-gradient(to right, ${primary}, ${hover})`;
  const root = document.documentElement;

  root.style.setProperty('--primary-color', primary);
  root.style.setProperty('--primary-hover', hover);
  root.style.setProperty('--primary-ring', `rgba(${r},${g},${b},0.25)`);
  root.style.setProperty('--color-accent-surface', `rgba(${r},${g},${b},0.08)`);
  root.style.setProperty('--gradient-from', primary);
  root.style.setProperty('--gradient-to', hover);
  root.style.setProperty('--brand-header-bg', gradient);
  root.style.setProperty('--btn-brand-bg', gradient);
  root.style.setProperty('--sidebar-nav-active', `rgba(${r},${g},${b},0.15)`);
  root.style.setProperty('--sidebar-nav-hover', `rgba(${r},${g},${b},0.08)`);
};

export const getStoredTenantBrandColor = () => {
  try {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const account = storedUser ? JSON.parse(storedUser) : null;
    return token && canUseTenantBranding(account) ? localStorage.getItem('tenant_primary_color') : null;
  } catch {
    return null;
  }
};

export const clearTenantBranding = () => {
  localStorage.removeItem('tenant_primary_color');
  localStorage.removeItem('tenant_logo');
  applyBrandColor(PLATFORM_BRAND.primaryColor);
};
