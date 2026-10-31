import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Sidebar } from '@/components/layout/Sidebar';

describe('Sidebar', () => {
    it('marca como activa la ruta actual', () => {
        render(
            <MemoryRouter initialEntries={['/pacientes']}>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Pacientes' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    });
});
