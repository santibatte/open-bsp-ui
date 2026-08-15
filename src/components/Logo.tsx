// Logo Velvet — luna creciente abrazando una gota (suavidad, guiño nocturno
// sutil). Azul profundo sobre celeste pastel, detalle en azul claro.
// Copiado de consultorio_dermatologico/webapp/src/components/Logo.tsx
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      {/* luna creciente */}
      <path
        d="M40 6c-13.8 3.2-24 15.6-24 30.2 0 10.4 5.2 19.6 13.2 25.2C16.4 58.2 7 46.6 7 32.8 7 16.4 20.2 3 36.6 3c1.2 0 2.3.1 3.4.2z"
        fill="#123257"
      />
      {/* gota / lágrima de belleza */}
      <path
        d="M42 22c5.4 7.4 9 12.6 9 17.4 0 5.4-4 9.6-9 9.6s-9-4.2-9-9.6c0-4.8 3.6-10 9-17.4z"
        fill="#2f6daa"
      />
      <path
        d="M42 30.5c2.7 3.9 4.5 6.7 4.5 9.2 0 2.9-2 5.1-4.5 5.1"
        stroke="#a6c1dd"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
