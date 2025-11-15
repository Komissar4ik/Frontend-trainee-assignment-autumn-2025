import { render as rtlRender, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '@/components/Layout';

const renderWithRouter = (
  ui: React.ReactElement,
  initialEntries = ['/list']
): ReturnType<typeof rtlRender> => {
  return rtlRender(
    <MemoryRouter
      initialEntries={initialEntries}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {ui}
    </MemoryRouter>
  );
};

describe('Layout', () => {
  it('should render children', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText('Список объявлений')).toBeInTheDocument();
    expect(screen.getByText('Статистика')).toBeInTheDocument();
  });

  it('should highlight active link', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>,
      ['/list']
    );

    const listLink = screen.getByText('Список объявлений').closest('a');
    expect(listLink).toHaveClass('active');
  });

  it('should highlight stats link when on stats page', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>,
      ['/stats']
    );

    const statsLink = screen.getByText('Статистика').closest('a');
    expect(statsLink).toHaveClass('active');
  });

  it('should render theme toggle button', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const themeButton = screen.getByTitle('Переключить тему');
    expect(themeButton).toBeInTheDocument();
  });

  it('should toggle theme when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const themeButton = screen.getByTitle('Переключить тему');
    const initialIcon = themeButton.textContent;

    await act(async () => {
      await user.click(themeButton);
    });

    await waitFor(() => {
      expect(themeButton.textContent).not.toBe(initialIcon);
    });
  });

  it('should not highlight inactive link', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>,
      ['/list']
    );

    const statsLink = screen.getByText('Статистика').closest('a');
    expect(statsLink).not.toHaveClass('active');
  });

  it('should render main content area', () => {
    renderWithRouter(
      <Layout>
        <div>Main Content</div>
      </Layout>
    );

    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });
});
