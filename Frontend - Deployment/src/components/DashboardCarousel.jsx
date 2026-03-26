import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary } from "../services/studentAnalyticsService";

// Render the dashboard carousel component.
const DashboardCarousel = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  // Holds the lightweight dashboard summary, separate from the full insights payload.
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // Fetch only the small summary contract needed for home-screen preview cards.
    getDashboardSummary().then((response) => {
      setSummary(response.data);
    });
  }, []);

  // These slides are intentionally summary cards; each CTA routes to the dedicated
  // insights page for deeper analytics instead of overloading the dashboard.
  const slides = [
    {
      id: 1,
      eyebrow: "FREQUENTLY MISTAKEN QUESTIONS",
      headline: String(summary?.frequently_mistaken_questions_count ?? "--"),
      metric: "to review",
      icon: "bx-file-find",
      iconClass:
        "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      cta: "View Insights",
    },
    {
      id: 2,
      eyebrow: "AVERAGE SCORE",
      headline: summary ? `${summary.average_score}%` : "--",
      metric: "accuracy",
      icon: "bx-target-lock",
      iconClass:
        "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      cta: "Open Insights",
    },
    {
      id: 3,
      eyebrow: "WEAKEST TOPIC",
      headline: summary?.weakest_topic?.name ?? "--",
      metric: summary?.weakest_topic
        ? `${Math.round(summary.weakest_topic.error_rate * 100)}% error rate`
        : "keep practicing",
      icon: "bx-trending-down",
      iconClass:
        "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      cta: "See Breakdown",
    },
  ];

  useEffect(() => {
    // Auto-rotate only the summary preview cards here. The full analytics stay
    // in the dedicated insights screen so the dashboard remains lightweight.
    const interval = setInterval(() => {
      if (!scrollRef.current || slides.length <= 1) return;

      const nextSlide = (activeSlide + 1) % slides.length;
      scrollRef.current.scrollTo({
        left: scrollRef.current.clientWidth * nextSlide,
        behavior: "smooth",
      });
      setActiveSlide(nextSlide);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSlide, slides.length]);

  // Handle scroll.
  const handleScroll = () => {
    if (!scrollRef.current) return;

    // Derive the active dot from the horizontal scroll position.
    const scrollPosition = scrollRef.current.scrollLeft;
    const slideWidth = scrollRef.current.clientWidth;
    const newActiveSlide = Math.round(scrollPosition / slideWidth);
    setActiveSlide(newActiveSlide);
  };

  // Manage go to slide.
  const goToSlide = (index) => {
    if (!scrollRef.current) return;

    // Dot buttons reuse the same scroll container instead of keeping separate slide state.
    scrollRef.current.scrollTo({
      left: scrollRef.current.clientWidth * index,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative mt-2 overflow-hidden rounded-2xl border border-slate-200/75 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 shadow-[0_24px_44px_rgba(148,163,184,0.16)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(2,6,23,0.98)_100%)] dark:shadow-[0_24px_44px_rgba(2,6,23,0.34)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/60 dark:bg-white/10"></div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth"
        style={{ width: "100%" }}
      >
        {slides.map((slide) => (
          <article key={slide.id} className="min-w-full shrink-0 snap-start">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="min-w-0 text-left">
                <p className="text-[clamp(0.7rem,2.2vw,0.98rem)] font-semibold tracking-tight text-slate-500 dark:text-slate-400">
                  {slide.eyebrow}
                </p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl dark:text-white">
                  {slide.headline}
                </h3>
              </div>
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${slide.iconClass}`}
              >
                <i
                  className={`bx ${slide.icon} text-xl`}
                ></i>
              </div>
            </div>

            <div className="mt-3 flex items-end gap-2 text-left sm:mt-6">
              <span className="text-[clamp(0.72rem,2.3vw,1rem)] font-medium text-slate-500 dark:text-slate-400">
                {slide.metric}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate("/student-insights")}
              className="mt-4 rounded-full bg-orange-500 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-orange-600"
            >
              {slide.cta}
            </button>
          </article>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {slides.map((_, index) => (
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
