interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 36, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* R letter shape */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 10H56Q84 10 84 37Q84 60 63 65L80 90H62L45 65H28V90H10V10ZM28 24H52Q66 24 66 37Q66 50 52 50H28V24Z"
        fill="#7C3AED"
      />
      {/* / slash */}
      <line x1="38" y1="85" x2="55" y2="47" stroke="#C4B5FD" strokeWidth="10" strokeLinecap="round" />
      {/* < chevron */}
      <path d="M30 63L18 73L30 83" stroke="#C4B5FD" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* > chevron */}
      <path d="M50 70L62 80L50 90" stroke="#7C3AED" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
