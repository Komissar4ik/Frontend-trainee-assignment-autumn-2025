import { render } from '@/test/utils';
import { AddCardSkeleton } from '@/components/AddCardSkeleton';

describe('AddCardSkeleton', () => {
  it('should render skeleton card', () => {
    const { container } = render(<AddCardSkeleton />);

    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
    expect(card.className).toContain('card');
  });
});
