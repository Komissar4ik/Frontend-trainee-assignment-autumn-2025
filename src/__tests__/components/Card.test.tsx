import { render, screen } from '@/test/utils';
import { Card } from '@/components/Card';

describe('Card', () => {
  it('should render children content', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('custom-class');
  });

  it('should be clickable when onClick is provided', () => {
    const handleClick = jest.fn();
    const { container } = render(<Card onClick={handleClick}>Clickable card</Card>);
    const card = container.querySelector('[role="button"]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('role', 'button');
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    const { container } = render(<Card onClick={handleClick}>Clickable card</Card>);
    const card = container.querySelector('[role="button"]') as HTMLElement;
    if (card) {
      card.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should not have button role when onClick is not provided', () => {
    render(<Card>Non-clickable card</Card>);
    const textElement = screen.getByText('Non-clickable card');
    const card = textElement.parentElement;
    expect(card).not.toHaveAttribute('role', 'button');
  });
});

