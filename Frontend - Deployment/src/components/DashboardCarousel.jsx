import { useState, useRef, useEffect } from "react";

const DASHBOARD_SLIDES = [
  {
    id: 1,
    eyebrow: "FREQUENTLY MISTAKE QUESTIONS",
    headline: "24",
    metric: "to review",
    icon: "bx-file-find",
    iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: 2,
    eyebrow: "AVERAGE SCORE",
    headline: "82%",
    metric: "accuracy",
    icon: "bx-target-lock",
    iconClass: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    id: 3,
    eyebrow: "RANKING",
    headline: "#5",
    metric: "in BSCpE",
    icon: "bx-trophy",
    iconClass: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  },
];

const DashboardCarousel = () => {
  const scrollRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const nextSlide = (activeSlide + 1) % DASHBOARD_SLIDES.length;
        scrollRef.current.scrollTo({
          left: scrollRef.current.clientWidth * nextSlide,
          behavior: "smooth",
        });
        setActiveSlide(nextSlide);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSlide]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollPosition = scrollRef.current.scrollLeft;
      const slideWidth = scrollRef.current.clientWidth;
      const newActiveSlide = Math.round(scrollPosition / slideWidth);
      setActiveSlide(newActiveSlide);
    }
  };

  const goToSlide = (index) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.clientWidth * index,
        behavior: "smooth",
      });
    }
  };

return (
    <section className="relative mt-2 mx-2 sm:mx-0 overflow-hidden rounded-[20px] sm:rounded-[30px] border border-slate-200/75 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-[clamp(0.75rem,3vw,1.2rem)] py-[clamp(0.8rem,3vw,1.35rem)] shadow-[0_24px_44px_rgba(148,163,184,0.16)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(2,6,23,0.98)_100%)] dark:shadow-[0_24px_44px_rgba(2,6,23,0.34)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/60 dark:bg-white/10"></div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto scroll-smooth overscroll-x-contain"
        style={{ width: "100%" }}
      >
        {DASHBOARD_SLIDES.map((slide) => (
          <article key={slide.id} className="w-full shrink-0 snap-start">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="min-w-0 text-left">
                <p className="text-[clamp(0.7rem,2.2vw,0.98rem)] font-semibold tracking-tight text-slate-500 dark:text-slate-400">
                  {slide.eyebrow}
                </p>
                <h3 className="mt-1 sm:mt-2 text-[clamp(1.4rem,5vw,2.15rem)] font-semibold leading-[1.05] tracking-tight text-slate-950 dark:text-white">
                  {slide.headline}
                </h3>
              </div>
              <div
                className={`flex size-[clamp(2.5rem,9vw,3.75rem)] shrink-0 items-center justify-center rounded-[14px] sm:rounded-[18px] ${slide.iconClass}`}
              >
                <i className={`bx ${slide.icon} text-[clamp(1.1rem,3.6vw,1.65rem)]`}></i>
              </div>
            </div>
            <div className="mt-3 sm:mt-6 flex items-end gap-1 sm:gap-2 text-left">
              <span className="text-[clamp(2rem,6vw,3.05rem)] font-semibold leading-none tracking-tight text-slate-950 dark:text-white">
                {slide.value}
              </span>
              <span className="mb-1 sm:mb-1.5 text-[clamp(0.72rem,2.3vw,1rem)] font-medium text-slate-500 dark:text-slate-400">
                {slide.metric}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Slide Indicators */}
      <div className="mt-4 flex justify-center gap-2">
        {DASHBOARD_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === activeSlide
                ? "w-6 bg-orange-500"
                : "w-1.5 bg-slate-300 dark:bg-slate-600"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default DashboardCarousel;
