import React, { useState, useEffect, useCallback } from 'react';

export interface TextileSlide {
  id: string;
  image: string;
  stage: string;
  title: string;
  description: string;
}

const TEXTILE_SLIDES: TextileSlide[] = [
  {
    id: 'yarn-spools',
    image: '/images/textile/yarn-spools.webp',
    stage: 'Hilandería & Alimentación',
    title: 'Conos de Hilos de Máxima Calidad',
    description:
      'Bobinas e hilados seleccionados de algodón peruano, calibrados para una alimentación continua sin roturas.',
  },
  {
    id: 'circular-loom',
    image: '/images/textile/circular-loom.webp',
    stage: 'Tejeduría Circular de Alta Velocidad',
    title: 'Transformación de Hilos en Tejidos',
    description:
      'Telares circulares automatizados que entrelazan miles de hebras por minuto para producir telas de alta densidad.',
  },
  {
    id: 'weaving-machinery',
    image: '/images/textile/weaving-machinery.webp',
    stage: 'Manufactura y Tramas Industriales',
    title: 'Precisión en Cada Urdimbre y Trama',
    description:
      'Maquinaria textil industrial operada bajo rigurosos estándares de tensión, gramaje y uniformidad en Perú.',
  },
  {
    id: 'fabric-warehouse',
    image: '/images/textile/fabric-warehouse.webp',
    stage: 'Acabado & Almacén de Rollos',
    title: 'Rollos de Tela con Trazabilidad Total',
    description:
      'Control de metraje, pesaje exacto e inspección de rollos listos para la industria de confección y exportación.',
  },
];

interface TextileCarouselProps {
  onSlideChange?: (index: number) => void;
  brandHeader?: React.ReactNode;
}

export const TextileCarousel: React.FC<TextileCarouselProps> = ({ onSlideChange, brandHeader }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % TEXTILE_SLIDES.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(currentIndex);
    }
  }, [currentIndex, onSlideChange]);

  // Autoplay timer
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      goToNext();
    }, 5500);

    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  const currentSlide = TEXTILE_SLIDES[currentIndex];

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Carrusel de producción textil"
    >
      {/* Background Slides with Crossfade and subtle Ken Burns zoom */}
      {TEXTILE_SLIDES.map((slide, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-out ${
              isActive ? 'opacity-100 scale-100 z-0' : 'opacity-0 scale-105 pointer-events-none -z-10'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
          </div>
        );
      })}

      {/* Layer 1: Brand overlay */}
      <div className="absolute inset-0 bg-primary-950/85 z-10" />
      {/* Layer 3: Subtle textile weave mesh texture */}
      <div
        className="absolute inset-0 opacity-[0.07] z-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Foreground Content: brand up top, slide copy stacked above the legal line */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between p-10 lg:p-12 text-white">
        {brandHeader}

        {/* Lower info: slide copy + pagination + legal line, all grouped at the bottom */}
        <div className="max-w-lg space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-300">
              {currentSlide.stage}
            </span>

            <h3 className="text-2xl sm:text-3xl font-bold leading-tight text-white tracking-tight">
              {currentSlide.title}
            </h3>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
              {currentSlide.description}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {TEXTILE_SLIDES.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Ir a la imagen ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    isActive ? 'w-8 bg-primary-400' : 'w-4 bg-white/30 hover:bg-white/60'
                  }`}
                />
              );
            })}
          </div>

          <p className="text-xs text-slate-400 pt-4 border-t border-white/10">
            © {new Date().getFullYear()} Textil L&amp;M — Planta de Producción Textil Perú
          </p>
        </div>
      </div>
    </div>
  );
};
