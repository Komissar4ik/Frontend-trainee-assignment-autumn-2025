import { render } from '@/test/utils';
import { AdCardSkeleton } from '@/components/AdCardSkeleton';

describe('AdCardSkeleton', () => {
  it('should render skeleton card', () => {
    const { container } = render(<AdCardSkeleton />);
    
    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
    expect(card.className).toContain('card');
  });
});

