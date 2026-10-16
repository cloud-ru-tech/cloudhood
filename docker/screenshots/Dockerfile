# Keep this tag aligned with @playwright/test. The image sets
# PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD, so a newer test runner cannot fetch browsers.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

# Ensure pnpm is available at the expected version.
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

# Install deps in their own layer, cache-keyed on the lockfile, before copying
# the rest of the source. The playwright-node-modules named volume starts
# empty on every fresh runner VM, so Docker seeds it from this image layer.
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

# Add custom fonts used by the extension UI.
COPY src/assets/fonts/*.woff2 /usr/local/share/fonts/

# Refresh font cache so Playwright/Chromium can pick them up.
RUN fc-cache -f -v
