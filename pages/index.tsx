import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import Bridge from "../components/Icons/Bridge";
import Logo from "../components/Icons/Logo";
import Modal from "../components/Modal";
import cloudinary from "../utils/cloudinary";
import getBase64ImageUrl from "../utils/generateBlurPlaceholder";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";

const Home: NextPage = ({ images }: { images: ImageProps[] }) => {
  const router = useRouter();
  const { photoId } = router.query;
  const [lastViewedPhoto, setLastViewedPhoto] = useLastViewedPhoto();

  const lastViewedPhotoRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // This effect keeps track of the last viewed photo in the modal to keep the index page in sync when the user navigates back
    if (lastViewedPhoto && !photoId) {
      lastViewedPhotoRef.current.scrollIntoView({ block: "center" });
      setLastViewedPhoto(null);
    }
  }, [photoId, lastViewedPhoto, setLastViewedPhoto]);

  const COLUMNS = 3;

  function getColumns(colIndex: number) {
    return images.filter(
      (resource, idx) => idx % COLUMNS === colIndex
    )
  }

  const columns = [getColumns(0), getColumns(1), getColumns(2)]

  return (
    <>
      <Head>
        <title>Caleb Yun</title>
        <meta
          property="og:image"
          content="https://nextjsconf-pics.vercel.app/og-image.png"
        />
        <meta
          name="twitter:image"
          content="https://nextjsconf-pics.vercel.app/og-image.png"
        />
      </Head>
      <main className="mx-auto max-w-screen-2xl">
        {photoId && (
          <Modal
            images={images}
            onClose={() => {
              setLastViewedPhoto(photoId);
            }}
          />
        )}

        <div className="flex m-auto">

          <aside id="default-sidebar" className="flex-none w-64 sticky top-0 h-screen">
            <div className="h-full px-3 py-4 overflow-y-auto">
              <ul className="space-y-2 font-medium">
                <li><span className="sidebar-title ms-3">Caleb Yun</span></li>
                <li><span className="ms-3">Photography</span></li>
              </ul>
            </div>
          </aside>

          <div className="p-4 grid grid-cols-3 gap-8">
            {columns.map((column, idx) => (
              <div className="flex flex-col gap-8" key={idx}>
                {column.map(({ id, public_id, format, blurDataUrl }) => (
                  <Link
                    key={id}
                    href={`/?photoId=${id}`}
                    as={`/p/${id}`}
                    ref={id === Number(lastViewedPhoto) ? lastViewedPhotoRef : null}
                    shallow
                    className="after:content group relative block w-full cursor-zoom-in after:pointer-events-none after:absolute after:shadow-highlight"
                  >
                    <Image
                      alt="Photo"
                      className="transform transition will-change-auto group-hover:brightness-90"
                      style={{ transform: "translate3d(0, 0, 0)" }}
                      placeholder="blur"
                      blurDataURL={blurDataUrl}
                      src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_scale,w_720/${public_id}.${format}`}
                      width={720}
                      height={0}
                      sizes="(max-width: 640px) 100vw,
                        (max-width: 1280px) 50vw,
                        (max-width: 1536px) 33vw,
                        25vw"
                    />
                  </Link>
                ))}
              </div>
            ))}
          </div>

        </div>
      </main>
      <footer className="p-6 text-center text-black/80 sm:p-12">
        &copy; Caleb Yun 2024
      </footer>
    </>
  );
};

export default Home;

export async function getStaticProps() {
  const results = await cloudinary.v2.search
    .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
    .with_field("context")
    .sort_by("filename", "desc")
    .max_results(400)
    .execute();
  let reducedResults: ImageProps[] = [];

  let i = 0;
  for (let result of results.resources) {
    reducedResults.push({
      id: i,
      height: result.height,
      width: result.width,
      public_id: result.public_id,
      format: result.format,
      caption: result.context.caption ?? ''
    });
    i++;
  }

  const blurImagePromises = results.resources.map((image: ImageProps) => {
    return getBase64ImageUrl(image);
  });
  const imagesWithBlurDataUrls = await Promise.all(blurImagePromises);

  for (let i = 0; i < reducedResults.length; i++) {
    reducedResults[i].blurDataUrl = imagesWithBlurDataUrls[i];
  }

  return {
    props: {
      images: reducedResults,
    },
  };
}
