import { render } from '@/test/utils';
import { Skeleton } from '@/components/Skeleton';

describe('Skeleton', () => {
  it('should render skeleton element', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('should apply custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="50px" />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });

  it('should apply custom className', () => {
    const { container } = render(<Skeleton className="custom-skeleton" />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toHaveClass('custom-skeleton');
  });

  it('should apply custom style', () => {
    const { container } = render(<Skeleton style={{ marginTop: '10px' }} />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toHaveStyle({ marginTop: '10px' });
  });
});
