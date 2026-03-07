/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@omsimos/pdf-to-images"],
  transpilePackages: ["@omsimos/ui"],
};

export default nextConfig;
