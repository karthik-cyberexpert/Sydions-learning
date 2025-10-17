import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Add your Supabase image domain here, e.g.,
      // {
      //   protocol: 'https',
      //   hostname: 'pqgsgoyqrfuwhmxvtbwz.supabase.co',
      //   port: '',
      //   pathname: '/storage/v1/object/public/**',
      // },
    ],
  },
};

export default nextConfig;