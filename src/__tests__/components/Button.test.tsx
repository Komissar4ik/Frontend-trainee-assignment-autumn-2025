import { render, screen } from '@/test/utils';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should apply primary variant by default', () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('primary');
  });

  it('should apply correct variant class', () => {
    const { rerender } = render(<Button variant="danger">Test</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('danger');

    rerender(<Button variant="success">Test</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('success');
  });

  it('should apply correct size class', () => {
    const { rerender } = render(<Button size="small">Test</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('small');

    rerender(<Button size="large">Test</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('large');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button');
    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );
    const button = screen.getByRole('button');
    button.click();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should pass through HTML button attributes', () => {
    render(
      <Button type="submit" aria-label="Submit form">
        Submit
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
  });
});
