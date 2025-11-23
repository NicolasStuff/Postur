import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// Utiliser le plugin next-intl avec le fichier de configuration
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
};

export default withNextIntl(nextConfig);
