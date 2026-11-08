import { CoverFrame } from '../../components/PosterRow';
import { LightImage } from './LightImage';

/**
 * Kapak ya da portre: ışık kaynağı görselin kendisi. Kitap kapakları ve kişi fotoğrafları geniş
 * perdeye yayılacak çözünürlükte değil; ışık görselin çevresinde yanar, altında yansıması durur.
 * Işık katmanı geniş olduğu için kullanan bölüm yatayda kırpmalı (`overflow-x-clip`).
 */
export function LitCover({ title, image }: { title: string; image: string | null }) {
  return (
    <div className="relative mx-auto w-44 self-start sm:w-52 lg:sticky lg:top-6 lg:w-full">
      <div aria-hidden="true" className="cover-light">
        <div className="room-light-inner">
          <LightImage path={image} variant="light" className="room-light-image" />
        </div>
      </div>
      <div aria-hidden="true" className="perde-floor">
        <LightImage path={image} variant="light" className="room-light-image" />
      </div>
      <CoverFrame title={title} className="perde-screen cover-glow">
        <LightImage
          path={image}
          variant="cover"
          className="absolute inset-0 size-full object-cover"
        />
      </CoverFrame>
    </div>
  );
}
