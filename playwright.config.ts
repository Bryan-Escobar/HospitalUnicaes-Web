import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
    testDir: './e2e',
    testMatch: '**/*.e2e.ts',
    use: {
        baseURL,
        channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || undefined,
        colorScheme: 'light',
        locale: 'es-SV',
        timezoneId: 'America/El_Salvador',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    projects: [
        { name: '1280px', use: { viewport: { width: 1280, height: 900 } } },
        { name: '1920px', use: { viewport: { width: 1920, height: 1080 } } },
    ],
    webServer: {
        command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
        url: baseURL,
        env: { VITE_SUPABASE_URL: 'https://your-project-id.supabase.co' },
    },
});
