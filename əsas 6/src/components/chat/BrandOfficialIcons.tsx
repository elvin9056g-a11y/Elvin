import React from 'react';

interface BrandIconProps {
  size?: number;
  className?: string;
}

// 1. Official Apple Logo (for iPhone & macOS)
export const AppleOfficialLogo: React.FC<BrandIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 170 170"
    fill="currentColor"
    className={`inline-block shrink-0 ${className}`}
  >
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.98-5.87-9.02-10.37-19.55-13.51-31.57-3.14-12.03-4.71-23.47-4.71-34.33 0-14.35 3.59-26.31 10.77-35.88 7.18-9.57 16.48-14.46 27.88-14.68 5.22 0 11.02 1.41 17.39 4.23 6.38 2.83 10.35 4.3 11.91 4.41 1.76-.11 5.92-1.63 12.49-4.57 6.57-2.94 12.18-4.3 16.83-4.09 12.82.65 23.01 5.43 30.58 14.35-10.87 6.63-16.19 15.86-15.97 27.69.22 9.13 3.69 16.84 10.43 23.14 6.74 6.3 14.78 10.04 24.12 11.22-2.39 7.28-5.43 15.09-9.12 23.42zM119.22 33.15c0-7.39 2.61-14.23 7.82-20.52 5.22-6.29 11.73-10.42 19.55-12.4 1.1 7.28-.22 14.44-3.96 21.48-3.75 7.04-9.33 11.99-16.76 14.85-.98-1.19-2.6-2.06-4.86-2.61-1.2-.55-1.79-.8-1.79-.8z" />
  </svg>
);

// 2. Official Android Robot (Bugdroid) Logo
export const AndroidOfficialLogo: React.FC<BrandIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block shrink-0 ${className}`}
  >
    <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.72 2.24 12.88 2 12 2s-1.72.24-2.64.63L7.88 1.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3C6.73 4.23 5.5 5.96 5.5 8h13c0-2.04-1.23-3.77-2.97-4.84zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
  </svg>
);

// 3. Official Microsoft Windows 4-Panes Logo
export const WindowsOfficialLogo: React.FC<BrandIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 88 88"
    fill="currentColor"
    className={`inline-block shrink-0 ${className}`}
  >
    <path d="M0 12.402l35.687-4.86.016 34.423-35.67.202L0 12.402zm35.67 33.529l.028 34.453L.028 75.48.016 46.133l35.654-.202zm4.327-39.043L87.95 0v41.527l-47.953.36V6.888zm47.965 38.653l-.012 42.459-47.953-6.742V45.901l47.965-.36z" />
  </svg>
);

// 4. Official macOS Finder Logo
export const MacOsOfficialLogo: React.FC<BrandIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 256 256"
    fill="currentColor"
    className={`inline-block shrink-0 ${className}`}
  >
    {/* Clean, authentic macOS Finder Face with Smile & Split Nose */}
    <rect width="256" height="256" rx="56" fill="currentColor" fillOpacity="0.15" />
    <path
      d="M128 40c-48.6 0-88 39.4-88 88s39.4 88 88 88 88-39.4 88-88-39.4-88-88-88zm-36 72c7.7 0 14 6.3 14 14s-6.3 14-14 14-14-6.3-14-14 6.3-14 14-14zm72 0c7.7 0 14 6.3 14 14s-6.3 14-14 14-14-6.3-14-14 6.3-14 14-14zm-75.5 58.2c6.2 13.8 19.8 23.8 35.5 24.8V172h8v23c15.7-1 29.3-11 35.5-24.8 1.6-3.6 5.8-5.2 9.4-3.6 3.6 1.6 5.2 5.8 3.6 9.4-7.8 17.5-25 30-44.5 31.8v12.2h-8V208c-19.5-1.8-36.7-14.3-44.5-31.8-1.6-3.6 0-7.8 3.6-9.4 3.6-1.6 7.8 0 9.4 3.4z"
      fill="currentColor"
    />
  </svg>
);

// 5. Official Linux Tux Penguin Logo
export const LinuxOfficialLogo: React.FC<BrandIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block shrink-0 ${className}`}
  >
    {/* Stylized official Tux Penguin */}
    <path d="M12 2C9.5 2 8 3.8 8 6.5c0 1.2.4 2.2 1 3-.7 1.5-2 3.8-2 6.5 0 2.5 1.5 4 4 4.5-.8.5-1.5 1.2-1.5 1.8 0 .8 1.5 1.2 2.5 1.2 1.5 0 2.5-.5 3-1.2.5.7 1.5 1.2 3 1.2 1 0 2.5-.4 2.5-1.2 0-.6-.7-1.3-1.5-1.8 2.5-.5 4-2 4-4.5 0-2.7-1.3-5-2-6.5.6-.8 1-1.8 1-3C16 3.8 14.5 2 12 2zm-1.5 4c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm3 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm-1.5 2.2c.8 0 1.8.3 1.8.8 0 .4-.8.8-1.8.8s-1.8-.4-1.8-.8c0-.5 1-.8 1.8-.8zm0 4.3c2.2 0 4 1.8 4 4.5 0 1.8-1.2 3-4 3s-4-1.2-4-3c0-2.7 1.8-4.5 4-4.5z" />
  </svg>
);

export const renderBrandSubcategoryIcon = (
  subId: string,
  size = 24,
  className = ''
): React.ReactElement => {
  switch (subId) {
    case 'iphone':
      return <AppleOfficialLogo size={size} className={className} />;
    case 'android':
      return <AndroidOfficialLogo size={size} className={className} />;
    case 'windows':
      return <WindowsOfficialLogo size={size} className={className} />;
    case 'macos':
      return <MacOsOfficialLogo size={size} className={className} />;
    case 'linux':
      return <LinuxOfficialLogo size={size} className={className} />;
    default:
      return <AppleOfficialLogo size={size} className={className} />;
  }
};
