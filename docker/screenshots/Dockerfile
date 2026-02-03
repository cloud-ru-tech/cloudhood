FROM mcr.microsoft.com/playwright:v1.57.0-noble

# Add custom fonts used by the extension UI.
COPY src/assets/fonts/*.otf /usr/local/share/fonts/

# Refresh font cache so Playwright/Chromium can pick them up.
RUN fc-cache -f -v

# Ensure pnpm is available at the expected version.
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app
