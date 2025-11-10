"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Leaf, Sparkles, ChefHat } from "lucide-react";
import clsx from "clsx";
import { collection, onSnapshot, orderBy, query, type DocumentData } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { SiteHeader } from "@/components/site-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ReservationForm } from "@/components/reservation-form";

const heroSlides = [
  {
    tag: "Pure Vegetarian Fine Dining",
    title: "A botanical symphony crafted by Chef Paheli.",
    description:
      "Experience hand-ground spices, edible flowers, and surprising textures in a culinary ritual that celebrates modern India.",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
  },
  {
    tag: "Nightfall Experiences",
    title: "Sensory rituals with botanical chai and cardamom aromas.",
    description:
      "Amber lighting, raga soundscapes, and zero-proof pairings create evenings that awaken every sense.",
    image:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1600&q=80",
  },
  {
    tag: "Artisanal Kitchen",
    title: "Local ingredients, ancestral techniques reimagined.",
    description:
      "We collaborate with New Jersey growers and spice artisans to present seasonal menus that evolve with the lunar calendar.",
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1600&q=80",
  },
];

const pillars = [
  {
    icon: <ChefHat className="h-5 w-5" />,
    title: "Vegetarian Fine Dining",
    description:
      "Seven-course tasting journeys that reinterpret traditional recipes with contemporary technique.",
  },
  {
    icon: <Leaf className="h-5 w-5" />,
    title: "Mindful Spices",
    description:
      "House-milled masalas and infused oils inspired by ayurvedic wisdom to nourish body and spirit.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Sensory Rituals",
    description:
      "Botanical chai pairings, gentle aromatherapy, and enveloping soundscapes for a multi-sensory voyage.",
  },
];

const tastingMenu = [
  {
    title: "Lotus & Saffron Ember",
    description:
      "Lotus blossom smoked over coconut charcoal, served with saffron beurre blanc and crisp murukku lace.",
  },
  {
    title: "Ancestral Forest Kitchari",
    description:
      "Truffled kitchari with wild mushrooms, golden lentils, and toasted pistachios, finished tableside with herb ghee.",
  },
  {
    title: "Ruby Tamarind Cloud",
    description:
      "Tamarind and rose granita, spiced yogurt cloud, and pomegranate pearls dusted with edible gold.",
  },
];

const menuCategories = [
  "All Menu",
  "Fast Food",
  "Chaat Station",
  "Sandwiches",
  "Entree · Punjab Ka Swad",
  "South Indian Affair",
  "Indo Asian Corner",
  "Dessert",
  "Beverages",
  "Breads",
  "Sides",
  "Tray Menu",
];

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  imageUrl?: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

type SelectedMenuItem = MenuItem | null;

type MenuCategoriesProps = {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  items: MenuItem[];
  loading: boolean;
  error: string | null;
  onSelectItem: (item: MenuItem) => void;
};

type MenuShowcaseProps = {
  items: MenuItem[];
  loading: boolean;
  onSelectItem: (item: MenuItem) => void;
};

function MenuShowcase({ items, loading, onSelectItem }: MenuShowcaseProps) {
  const showcaseItems = items.slice(0, 5);

  return (
    <section className="w-full border-y border-white/10 bg-white/5">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">
              Menu inspirations
            </p>
            <h2 className="font-display text-3xl text-white sm:text-4xl">
              Seasonal signatures and future pairings.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-white/70">
              Evolving highlights curated by the culinary team. Coming soon.
            </p>
          </div>
        </div>
        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`showcase-skeleton-${index}`}
                className="h-full rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4"
              >
                <div className="h-24 w-full rounded-xl bg-white/10 sm:h-32" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-3/5 rounded-full bg-white/10" />
                  <div className="h-3 w-full rounded-full bg-white/10" />
                  <div className="h-3 w-2/3 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : showcaseItems.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-white/50">
            Menu highlights are being crafted. Check back soon.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {showcaseItems.map((item, index) => (
              <motion.article
                key={`${item.id}-${index}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-white shadow-[0_18px_45px_rgba(0,0,0,0.3)] backdrop-blur"
                onClick={() => onSelectItem(item)}
              >
                <div className="relative h-28 w-full overflow-hidden sm:h-36">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 220px"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center bg-white/5 text-xs text-white/60">
                      Photo coming soon
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.35em] text-white/75">
                    {item.category || "Menu"}
                  </div>
                </div>
                <div className="space-y-2 px-4 py-3">
                  <div className="space-y-1">
                    <h3 className="line-clamp-1 font-display text-base text-white">
                      {item.name}
                    </h3>
                    <span className="inline-flex w-fit rounded-md border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] text-white/80">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  {item.description ? (
                    <p className="text-[11px] leading-snug text-white/70 line-clamp-3">
                      {item.description}
                    </p>
                  ) : null}
                  {/* tag chips removed */}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MenuCategories({
  categories,
  selectedCategory,
  onSelectCategory,
  items,
  loading,
  error,
  onSelectItem,
}: MenuCategoriesProps) {
  return (
    <section className="w-full border-b border-white/10 bg-[rgba(10,20,16,0.75)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Menu Categories
          </p>
          <h2 className="font-display text-3xl text-white sm:text-4xl">
            Discover every ritual of flavor
          </h2>
        </div>
        <div className="-mx-4 overflow-x-auto pb-2 sm:-mx-6 md:mx-0 md:overflow-visible">
          <div className="flex w-full min-w-full gap-2 px-4 sm:px-6 md:flex-wrap md:gap-3 md:px-0">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={clsx(
                  "rounded-full border px-4 py-2 text-sm transition whitespace-nowrap",
                  selectedCategory === category
                    ? "border-emerald-300/70 bg-emerald-300/20 text-emerald-100"
                    : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10 hover:text-white"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-red-400/40 bg-red-500/15 p-6 text-sm text-red-100">
            {error}
          </div>
        ) : (
          <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`menu-skeleton-${index}`}
                  className="min-h-[260px] w-full animate-pulse rounded-3xl border border-white/10 bg-white/5 p-4 sm:min-h-[320px] sm:p-5"
                >
                  <div className="h-40 w-full rounded-2xl bg-white/10 sm:h-[220px]" />
                  <div className="mt-3 space-y-3">
                    <div className="h-4 w-2/3 rounded-full bg-white/10" />
                    <div className="h-3 w-full rounded-full bg-white/10" />
                    <div className="h-3 w-1/2 rounded-full bg-white/5" />
                  </div>
                </div>
              ))
            ) : items.length > 0 ? (
              items.map((item, index) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="group relative flex min-h-[260px] w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/10 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur cursor-pointer sm:min-h-[320px]"
                  onClick={() => onSelectItem(item)}
                >
                  <div className="relative h-40 w-full overflow-hidden sm:h-[220px]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 1200px) 50vw, 25vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center bg-white/5 text-xs text-white/60">
                        Photo coming soon
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.35em] text-white/75">
                      {item.category}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between space-y-2 px-4 py-3">
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <h3 className="line-clamp-1 font-display text-base text-white">
                          {item.name}
                        </h3>
                        <span className="inline-flex w-fit rounded-md border border-white/15 bg-white/10 px-3 py-0.5 text-xs text-white/70">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      {item.description ? (
                        <p className="text-[11px] leading-snug text-white/70">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    {/* tag chips removed */}
                  </div>
                </motion.article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-white/50">
                The menu is blossoming soon. Visit again shortly.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
const testimonials = [
  {
    name: "Nikita Rao",
    role: "Food Critic, Modern Palates",
    quote:
      "Praana redefines vegetarian luxury. Every plate feels like poetry, from the aromas drifting across the table to the impeccable service rhythm.",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Daniel Schwartz",
    role: "Editor, The Conscious Diner",
    quote:
      "A choreography of spices and textures. Paheli guides you with warmth through a journey of flavors that transcends labels.",
    image:
      "https://images.unsplash.com/photo-1502828331539-51c709e80300?auto=format&fit=crop&w=160&q=80",
  },
];

function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6500);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setActiveIndex((index + heroSlides.length) % heroSlides.length);
  };

  const currentSlide = heroSlides[activeIndex];

  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="relative aspect-[16/10] w-full sm:aspect-[16/7.5] md:aspect-[16/6] lg:aspect-[16/4.5]">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentSlide.image}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image
                src={currentSlide.image}
                alt={currentSlide.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 flex flex-col justify-end gap-6 px-5 pb-10 text-white sm:px-10 lg:px-20">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
              {currentSlide.tag}
            </div>
            <h2 className="max-w-2xl font-display text-2xl leading-snug text-white sm:text-3xl md:text-4xl">
              {currentSlide.title}
            </h2>
            <p className="max-w-2xl text-sm text-white/75 sm:text-[15px] md:text-lg">
              {currentSlide.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => goToSlide(activeIndex - 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition hover:border-white/40 hover:bg-white/20"
                  aria-label="Previous slide"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goToSlide(activeIndex + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition hover:border-white/40 hover:bg-white/20"
                  aria-label="Next slide"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => goToSlide(index)}
                    className={clsx(
                      "h-2.5 w-8 rounded-full transition",
                      index === activeIndex
                        ? "bg-white"
                        : "bg-white/30 hover:bg-white/50"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(menuCategories[0]);
  const [selectedItem, setSelectedItem] = useState<SelectedMenuItem>(null);

  const filteredMenuItems = useMemo(
    () =>
      selectedCategory === "All Menu"
        ? menuItems
        : menuItems.filter((item) => item.category === selectedCategory),
    [menuItems, selectedCategory]
  );
  const showcaseItems = useMemo(() => menuItems.slice(0, 5), [menuItems]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        const db = getFirebaseFirestore();
        const menuQuery = query(
          collection(db, "menuItems"),
          orderBy("createdAt", "desc")
        );
        unsubscribe = onSnapshot(
          menuQuery,
          (snapshot) => {
            const items: MenuItem[] = snapshot.docs.map((doc) => {
              const data = doc.data() as DocumentData;
              return {
                id: doc.id,
                name: data.name ?? "Untitled dish",
                description: data.description ?? "",
                price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
                category: data.category ?? "Uncategorized",
                tags: Array.isArray(data.tags) ? data.tags : [],
                imageUrl: data.imageUrl ?? undefined,
                createdAt: data.createdAt,
              };
            });
            setMenuItems(items);
            setMenuLoading(false);
            setMenuError(null);
          },
          (error) => {
            console.error("Landing menu subscription error:", error);
            setMenuError(
              error.code === "permission-denied"
                ? "We cannot display the menu. Please adjust Firestore read permissions."
                : "Unable to load the menu right now."
            );
            setMenuLoading(false);
          }
        );
      } catch (error) {
        console.error("Landing menu init error:", error);
        setMenuError("Menu service is unavailable. Verify Firebase configuration.");
        setMenuLoading(false);
      }
    };

    void init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <>
      <div className="relative flex min-h-screen w-full flex-col bg-[radial-gradient(circle_at_top,_rgba(225,178,105,0.18),_transparent_55%),_var(--praana-background)] pt-24 text-neutral-100 sm:pt-28">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-36 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(137,220,179,0.26)_0%,_transparent_60%)] blur-3xl" />
          <div className="absolute -left-32 top-[36rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(225,178,105,0.22)_0%,_transparent_65%)] blur-[120px]" />
          <div className="absolute right-0 top-[20rem] h-96 w-48 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_0%,_transparent_70%)] blur-[90px]" />
        </div>

        <SiteHeader />
        <HeroCarousel />

        <MenuShowcase
          items={showcaseItems}
          loading={menuLoading}
          onSelectItem={setSelectedItem}
        />
        <MenuCategories
          categories={menuCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          items={filteredMenuItems}
          loading={menuLoading}
          error={menuError}
          onSelectItem={setSelectedItem}
        />
        <section id="reservations" className="px-4 py-14 sm:px-6 lg:px-10">
          <ReservationForm />
        </section>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 pb-24 pt-14 sm:px-6 lg:gap-24 lg:px-10 lg:pb-28 lg:pt-16">
          <section
            id="rituals"
            className="grid gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:gap-10"
          >
            {pillars.map((pillar, index) => (
              <motion.article
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
                className="glass-panel group relative overflow-hidden p-6 sm:p-7"
              >
                <div className="absolute right-6 top-6 h-12 w-12 rounded-full border border-white/10 bg-white/5 transition duration-500 group-hover:scale-110 group-hover:border-emerald-200/60" />
                <div className="relative z-[1] flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-emerald-200">
                  {pillar.icon}
                </div>
                <h3 className="relative z-[1] mt-6 font-display text-2xl text-white">
                  {pillar.title}
                </h3>
                <p className="relative z-[1] mt-3 text-sm leading-relaxed text-white/70">
                  {pillar.description}
                </p>
              </motion.article>
            ))}
          </section>

          <section
            id="tasting-menu"
            className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-200/70">
                Tasting Menu · Monsoon Season
              </p>
              <h2 className="font-display text-3xl text-white sm:text-4xl">
                A journey across liquid textures, gentle embers, and spiced blooms.
              </h2>
              <p className="max-w-xl text-sm text-white/70 sm:text-base">
                Each menu shifts with the moon. We partner with local farmers,
                artisan spice makers, and Wayne hydroponic gardens to craft
                memorable experiences.
              </p>
              <div className="grid gap-6">
                {tastingMenu.map((course) => (
                  <div
                    key={course.title}
                    className="glass-panel group space-y-2 border-white/15 px-5 py-4 transition hover:border-emerald-200/40 hover:bg-white/10 sm:px-6 sm:py-5"
                  >
                    <p className="font-display text-lg text-white">
                      {course.title}
                    </p>
                    <p className="text-sm leading-relaxed text-white/70">
                      {course.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, amount: 0.3 }}
              className="glass-panel flex flex-col gap-7 border-white/15 px-6 py-8 sm:px-8 sm:py-10"
            >
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                Voices that inspire us
              </div>
              <h2 className="font-display text-3xl text-white sm:text-4xl">
                Recognition from those who live the experience.
              </h2>
              <div className="space-y-7">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.name} className="space-y-4">
                    <p className="text-base text-white/70">
                      “{testimonial.quote}”
                    </p>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div>
                        <p className="text-white/80">{testimonial.name}</p>
                        <p>{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true, amount: 0.3 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(137,220,179,0.35),_transparent_65%),_rgba(16,26,21,0.92)]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.12)_0%,transparent_40%,rgba(255,255,255,0.04)_100%)]" />
              <div className="relative grid gap-6 px-6 py-10 sm:px-10 sm:py-12">
                <p className="text-xs uppercase tracking-[0.4em] text-white/55">
                  Chef Paheli&rsquo;s kitchen
                </p>
                <p className="font-display text-3xl leading-tight text-white sm:text-4xl">
                  “I cook with memory, in dialogue across generations, to connect
                  bodies and emotions.”
                </p>
                <p className="max-w-lg text-sm text-white/70">
                  Chef-founder Paheli Ashok grew up between Jaipur markets and
                  classical dance studios. Praana is her love letter to Indian
                  vegetarian traditions, conceived with modern aesthetics and a
                  sustainable vision.
                </p>
                <button className="self-start rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white">
                  Meet the team
                </button>
              </div>
            </motion.div>
          </section>
        </main>

        <footer
          id="site-footer"
          className="border-t border-white/10 bg-black/20 backdrop-blur"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 text-sm text-white/60 sm:px-6 lg:px-10">
            <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Image
                    src="/images/logo.png"
                    alt="Praana by Paheli logo"
                    width={520}
                    height={160}
                    className="h-28 w-auto object-contain brightness-0 invert sm:h-32"
                    priority
                  />
                </div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                  Praana By Paheli
                </p>
                <p className="font-display text-2xl text-white">
                  Pure Vegetarian Indian Restaurant
                </p>
              </div>
              <div className="flex flex-col gap-3 text-sm text-white/70 md:text-right">
                <span>1210 Hamburg Tpke a07 · Wayne, NJ 07470</span>
                <span>reservations@praanabypaheli.com · (973) 987-3089</span>
                <span>Service: Outdoor seating · Vegan options · Live music</span>
                <span className="whitespace-pre-line">
                  {[
                    "Sunday · 10 a.m.–3 p.m., 4:30–9 p.m.",
                    "Monday · Closed",
                    "Tuesday (Veterans Day) · 10 a.m.–3 p.m., 4:30–9 p.m. · Los horarios pueden variar",
                    "Wednesday · 10 a.m.–3 p.m., 4:30–9 p.m.",
                    "Thursday · 10 a.m.–3 p.m., 4:30–9 p.m.",
                    "Friday · 10 a.m.–3 p.m., 4:30–9:30 p.m.",
                    "Saturday · 10 a.m.–3 p.m., 4:30–9:30 p.m.",
                  ].join("\n")}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 border-t border-white/10 pt-6 text-center text-xs tracking-[0.35em] text-white/40">
              <span>
                © {new Date().getFullYear()} Praana By Paheli — Powered & designed by Freedom Labs
              </span>
            </div>
          </div>
        </footer>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem ? (
          <DialogContent className="max-w-3xl overflow-hidden border border-white/15 bg-[#101b15]/95 text-white">
            <DialogHeader>
              <DialogTitle className="font-display text-3xl text-white">
                {selectedItem.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-white/60">
                {selectedItem.category}
              </DialogDescription>
            </DialogHeader>
            <div className="flex h-full flex-col gap-4 overflow-auto pr-1">
              <div className="relative h-[340px] w-full overflow-hidden rounded-2xl border border-white/10">
                {selectedItem.imageUrl ? (
                  <Image
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    fill
                    sizes="500px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-white/5 text-sm text-white/60">
                    Photo coming soon
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {selectedItem.description ? (
                  <p className="text-sm leading-relaxed text-white/70">
                    {selectedItem.description}
                  </p>
                ) : null}
                <div className="flex items-center gap-4 text-sm text-white/70">
                  <span className="rounded-full border border-white/20 bg-white/5 px-4 py-1 text-white/90">
                    ${selectedItem.price.toFixed(2)}
                  </span>
                  {selectedItem.tags?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.tags.map((tag) => (
                        <span
                          key={`${selectedItem.id}-modal-${tag}`}
                          className="rounded-full border border-emerald-200/40 bg-emerald-200/10 px-3 py-1 text-xs text-emerald-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  Added to the Praana experience menu
                </p>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

