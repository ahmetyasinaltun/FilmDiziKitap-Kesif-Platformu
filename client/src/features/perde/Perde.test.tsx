import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Perde } from './Perde';

/** Perde, fragman düğmesi ve sayfanın geri kalanı: gerçek sayfanın en küçük hali. */
function Page() {
  const [trailer, setTrailer] = useState<string | null>(null);
  const opener = useRef<HTMLButtonElement>(null);

  return (
    <>
      <header>
        <a href="/">Ana sayfa</a>
      </header>
      <main>
        <Perde
          path={null}
          title="Parazit"
          playingTrailer={trailer}
          onCloseTrailer={() => setTrailer(null)}
          returnFocus={opener}
        >
          <p>Altyazı</p>
        </Perde>
        <button ref={opener} type="button" onClick={() => setTrailer('abc123')}>
          Fragmanı izle
        </button>
      </main>
    </>
  );
}

describe('fragman', () => {
  it('açılınca odak perdede kalır, sayfanın geri kalanı erişilemez olur', async () => {
    render(<Page />);
    const opener = screen.getByRole('button', { name: 'Fragmanı izle' });

    await userEvent.setup().click(opener);

    expect(screen.getByRole('dialog', { name: 'Parazit fragmanı' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fragmanı kapat' })).toHaveFocus();
    expect(screen.getByRole('banner')).toHaveAttribute('inert');
    expect(opener).toHaveAttribute('inert');
  });

  it('Escape ile kapanır; önce sayfa geri gelir, sonra odak fragman düğmesine döner', async () => {
    render(<Page />);
    const user = userEvent.setup();
    const opener = screen.getByRole('button', { name: 'Fragmanı izle' });
    await user.click(opener);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Parazit fragmanı')).not.toBeInTheDocument();
    expect(screen.getByRole('banner')).not.toHaveAttribute('inert');
    expect(opener).not.toHaveAttribute('inert');
    expect(opener).toHaveFocus();
  });
});
