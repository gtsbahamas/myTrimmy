/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip ESLint during builds - run lint separately in CI
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Keep TypeScript type checking during builds
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow images from Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
