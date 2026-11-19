import { expect, test, type Locator } from '@playwright/test';

const screens: { title: string; path: string; content: (main: Locator) => Locator }[] = [
    { title: 'Dashboard', path: '/dashboard', content: (main) => main.getByRole('progressbar', { name: 'Ocupación total' }) },
    { title: 'Usuarios y personal', path: '/usuarios', content: (main) => main.getByRole('button', { name: /^Desactivar a / }).first() },
    { title: 'Turnos', path: '/turnos', content: (main) => main.getByRole('cell', { name: /Recepción/ }).first() },
    { title: 'Mapa de plantas', path: '/mapa-plantas', content: (main) => main.getByRole('button', { name: /\bLibre\b/ }).first() },
    { title: 'Ambulancia', path: '/ambulancia', content: (main) => main.getByText(/^AMB-001 · Desde/) },
];

test('navega las cinco pantallas con datos, sin desbordamiento ni errores en la consola', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('admin@example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill('prueba-panel');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    const navigation = page.getByRole('navigation', { name: 'Navegación principal' });
    const main = page.getByRole('main');

    for (const { title, path, content } of screens) {
        await test.step(title, async () => {
            const link = navigation.getByRole('link', { name: title, exact: true });
            await link.click();
            await expect(page).toHaveURL(path);
            await expect(link).toHaveAttribute('aria-current', 'page');
            await expect(main.getByRole('heading', { name: title, level: 1 })).toBeVisible();
            await expect(content(main)).toBeInViewport({ ratio: 1 });

            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
            expect(overflow, 'La página debe ajustarse al ancho de la ventana').toBeLessThanOrEqual(0);
            await page.screenshot({ path: testInfo.outputPath(`${path.slice(1)}.png`), animations: 'disabled' });
            expect(errors, 'Errores del navegador').toEqual([]);
        });
    }
});
