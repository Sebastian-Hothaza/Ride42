import { useEffect, useMemo, useRef, useState } from 'react';
import './stylesheets/card.css'

// Cards have fixed image width and will adjust height as required while not skewing aspect ratio

const Card = ({ heading, body, img, images: imagesProp, inverted }) => {
    const images = useMemo(() => {
        const rawImages = Array.isArray(img)
            ? img
            : Array.isArray(imagesProp)
                ? imagesProp
                : img
                    ? [img]
                    : [];

        const preparedImages = rawImages.filter(Boolean);

        return preparedImages;
    }, [img, imagesProp]);

    const imageSignature = useMemo(
        () => images.map((image) => String(image)).join('|'),
        [images]
    );
    const previousImageSignature = useRef(imageSignature);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (previousImageSignature.current !== imageSignature) {
            setCurrentIndex(0);
            previousImageSignature.current = imageSignature;
        }
    }, [imageSignature]);

    const hasMultipleImages = Array.isArray(imagesProp) && imagesProp.length > 1 || Array.isArray(img) && img.length > 1 || false;
    const currentImage = images[currentIndex] || null;

    const goToPreviousImage = () => {
        setCurrentIndex((previousIndex) =>
            previousIndex === 0 ? images.length - 1 : previousIndex - 1
        );
    };

    const goToNextImage = () => {
        setCurrentIndex((previousIndex) =>
            previousIndex === images.length - 1 ? 0 : previousIndex + 1
        );
    };

    return (<>
        {inverted ?
            <div className='card'>
                {currentImage ? (
                    <div className='cardImageCarousel'>
                        <img src={currentImage} alt={`${heading} preview`} />
                        {hasMultipleImages && (
                            <>
                                <button type='button' className='carouselArrow carouselArrowPrev' onClick={goToPreviousImage} aria-label='Previous image'>❮</button>
                                <button type='button' className='carouselArrow carouselArrowNext' onClick={goToNextImage} aria-label='Next image'>❯</button>
                            </>
                        )}
                    </div>
                ) : null}
                <div className='cardContent'>
                    <h1 id='mainLabel'style={{alignSelf: 'flex-end'}}>{heading}</h1>
                    {body}
                </div>
            </div>
            :
            <div className='card'>
                <div className='cardContent'>
                    <h1 id='mainLabel'>{heading}</h1>
                    {body}
                </div>
                {currentImage ? (
                    <div className='cardImageCarousel'>
                        <img src={currentImage} alt={`${heading} preview`} />
                        {hasMultipleImages && (
                            <>
                                <button type='button' className='carouselArrow carouselArrowPrev' onClick={goToPreviousImage} aria-label='Previous image'>❮</button>
                                <button type='button' className='carouselArrow carouselArrowNext' onClick={goToNextImage} aria-label='Next image'>❯</button>
                            </>
                        )}
                    </div>
                ) : null}
            </div>
        }
    </>
    );
};

export default Card;