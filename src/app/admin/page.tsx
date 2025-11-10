"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  MenuSquare,
  Tags,
  ImagePlus,
  DollarSign,
  X,
  CalendarDays,
  Pencil,
  Trash2,
  Search,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  getFirebaseFirestore,
  getFirebaseStorage,
} from "@/lib/firebase";
import { ReservationTestEmail } from "@/components/reservation-test-email";

type SidebarItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  disabled?: boolean;
};

const sidebarItems: SidebarItem[] = [
  {
    id: "reservations",
    label: "Reservations",
    description: "Review guest bookings",
    icon: CalendarDays,
  },
  {
    id: "menu",
    label: "Menu",
    description: "Create and curate dishes",
    icon: MenuSquare,
  },
  {
    id: "collections",
    label: "Collections",
    description: "Seasonal tastings & pairings",
    icon: Tags,
  },
  {
    id: "media",
    label: "Media Library",
    description: "Photography & assets",
    icon: ImagePlus,
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

const menuTags = [
  "Signature",
  "New",
  "Limited",
  "Chef's Table",
  "Vegan",
  "Jain",
];

const collectionTemplates = [
  {
    id: "signature-evening",
    title: "Signature Evening",
    description:
      "Seven-course tasting with seasonal cocktails and immersive plating choreography.",
    status: "Concept",
    focus: "Chef's tasting · 18 guests",
  },
  {
    id: "chai-n-chapter",
    title: "Chai & Chapter",
    description:
      "Guided tea service with heirloom snacks, regional storytelling, and poetry pairing.",
    status: "Draft",
    focus: "Afternoon lounge · 24 guests",
  },
  {
    id: "sindhu-solstice",
    title: "Sindhu Solstice",
    description:
      "Monsoon-inspired coursed dinner celebrating coastal harvests and smoke-fired techniques.",
    status: "Archived",
    focus: "Pop-up residency · 32 guests",
  },
];

const mediaLibraryBuckets = [
  {
    id: "hero-gallery",
    label: "Hero Gallery",
    description: "Homepage, hero sliders, launch announcements, and marquee dishes.",
    assetCount: 18,
    updatedAt: "3 days ago",
  },
  {
    id: "social-kit",
    label: "Social Kit",
    description: "Short-form reels, behind-the-scenes captures, and influencer drops.",
    assetCount: 42,
    updatedAt: "6 hours ago",
  },
  {
    id: "press-room",
    label: "Press Room",
    description:
      "Logos, press-ready imagery, brand guidelines, and media contact resources.",
    assetCount: 9,
    updatedAt: "Yesterday",
  },
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

type FormState = {
  name: string;
  price: string;
  description: string;
  category: string;
  file: File | null;
};

type Reservation = {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  occasion?: string;
  notes?: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

type ReservationFormState = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: string;
  occasion: string;
  notes: string;
};

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("reservations");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Menu");
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationsError, setReservationsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editFormState, setEditFormState] = useState<ReservationFormState | null>(null);
  const [isUpdatingReservation, setIsUpdatingReservation] = useState(false);
  const [reservationActionMessage, setReservationActionMessage] = useState<string | null>(null);
  const [reservationActionError, setReservationActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({
    name: "",
    price: "",
    description: "",
    category: "",
    file: null,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
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
              price: typeof data.price === "number" ? data.price : 0,
              category: data.category ?? "Uncategorized",
              tags: Array.isArray(data.tags) ? data.tags : [],
              imageUrl: data.imageUrl ?? undefined,
              createdAt: data.createdAt,
            };
          });
          setMenuItems(items);
          setLoadingItems(false);
          setItemsError(null);
        },
        (error) => {
          console.error("Firestore subscription error:", error);
          setItemsError(
            error.code === "permission-denied"
              ? "Access to menuItems is denied. Please update Firestore rules to allow read access."
              : "Unable to load menu items. Please try again later."
          );
          setLoadingItems(false);
        }
      );
    } catch (error) {
      console.error("Firestore initialization error:", error);
      setItemsError(
        "Unable to initialize Firestore. Verify Firebase configuration and rules."
      );
      setLoadingItems(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const db = getFirebaseFirestore();
      const reservationsQuery = query(
        collection(db, "reservations"),
        orderBy("createdAt", "desc")
      );
      unsubscribe = onSnapshot(
        reservationsQuery,
        (snapshot) => {
          const items: Reservation[] = snapshot.docs.map((doc) => {
            const data = doc.data() as DocumentData;
            const partySizeValue =
              typeof data.partySize === "number"
                ? data.partySize
                : Number(data.partySize ?? 0) || 0;
            return {
              id: doc.id,
              name: data.name ?? "Guest",
              email: data.email ?? "",
              phone: data.phone ?? "",
              date: data.date ?? "",
              time: data.time ?? "",
              partySize: partySizeValue,
              occasion: data.occasion ?? "",
              notes: data.notes ?? "",
              createdAt: data.createdAt,
            };
          });
          setReservations(items);
          setLoadingReservations(false);
          setReservationsError(null);
        },
        (error) => {
          console.error("Firestore reservations subscription error:", error);
          setReservationsError(
            error.code === "permission-denied"
              ? "Access to reservations is denied. Update Firestore rules to allow read access."
              : "Unable to load reservations. Please try again later."
          );
          setLoadingReservations(false);
        }
      );
    } catch (error) {
      console.error("Firestore reservations initialization error:", error);
      setReservationsError(
        "Unable to initialize Firestore for reservations. Verify Firebase configuration and rules."
      );
      setLoadingReservations(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const reservationMonths = useMemo(() => {
    const months = new Set<string>();
    reservations.forEach(({ date }) => {
      if (typeof date === "string" && date.length >= 7) {
        months.add(date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    return reservations.filter((reservation) => {
      const reservationDate = reservation.date ?? "";
      const matchesMonth =
        monthFilter === "all" || reservationDate.startsWith(monthFilter);
      const matchesStart =
        !startDate || (reservationDate && reservationDate >= startDate);
      const matchesEnd =
        !endDate || (reservationDate && reservationDate <= endDate);
      const matchesSearch =
        !lowerSearch ||
        [
          reservation.name,
          reservation.email,
          reservation.phone,
          reservation.occasion,
          reservation.notes,
          reservation.id,
        ]
          .map((value) => (value ?? "").toString().toLowerCase())
          .some((value) => value.includes(lowerSearch));

      return matchesMonth && matchesStart && matchesEnd && matchesSearch;
    });
  }, [reservations, searchTerm, monthFilter, startDate, endDate]);

  const filteredMenu =
    selectedCategory === "All Menu"
      ? menuItems
      : menuItems.filter((dish) => dish.category === selectedCategory);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFieldChange =
    (field: keyof Omit<FormState, "file">) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { value } = event.currentTarget;
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    setFormState((prev) => ({ ...prev, file }));
  };

  const resetForm = () => {
    setFormState({
      name: "",
      price: "",
      description: "",
      category: "",
      file: null,
    });
    setSelectedTags([]);
  setFormError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateDish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formState.name.trim()) {
      setFormError("Please provide a dish name.");
      return;
    }
    if (!formState.price) {
      setFormError("Please provide a price in USD.");
      return;
    }
  const numericPrice = Number(formState.price);
  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    setFormError("Please provide a valid non-negative price.");
    return;
  }
    if (!formState.category) {
      setFormError("Please select a category for this dish.");
      return;
    }

    setIsSubmitting(true);
    try {
      const db = getFirebaseFirestore();
      const storage = getFirebaseStorage();

      let imageUrl: string | undefined;
      if (formState.file) {
        const fileExtension = formState.file.name.split(".").pop() ?? "jpg";
        const storageRef = ref(
          storage,
          `menu/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExtension}`
        );
        const snapshot = await uploadBytes(storageRef, formState.file, {
          contentType: formState.file.type,
        });
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, "menuItems"), {
        name: formState.name.trim(),
        description: formState.description.trim(),
    price: numericPrice,
        category: formState.category,
        tags: selectedTags,
        imageUrl: imageUrl ?? "",
        createdAt: serverTimestamp(),
      });

      setFormSuccess("Dish published successfully.");
      resetForm();
      setIsModalOpen(false);
    } catch (error: unknown) {
      console.error("Error creating dish:", error);
      const message =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "permission-denied"
          ? "Permission denied when writing to Firestore or Storage. Please update Firebase rules to allow authenticated or development access."
          : "Unable to publish dish. Please try again.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditReservation = (reservation: Reservation) => {
    setReservationActionError(null);
    setReservationActionMessage(null);
    setEditingReservation(reservation);
    setEditFormState({
      name: reservation.name ?? "",
      email: reservation.email ?? "",
      phone: reservation.phone ?? "",
      date: reservation.date ?? "",
      time: reservation.time ?? "",
      partySize: reservation.partySize ? String(reservation.partySize) : "1",
      occasion: reservation.occasion ?? "",
      notes: reservation.notes ?? "",
    });
  };

  const handleEditFieldChange = (field: keyof ReservationFormState) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { value } = event.currentTarget;
      setEditFormState((prev) =>
        prev
          ? {
              ...prev,
              [field]: value,
            }
          : prev
      );
    };

  const handleUpdateReservation = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!editingReservation || !editFormState) {
      return;
    }

    setIsUpdatingReservation(true);
    setReservationActionMessage(null);
    setReservationActionError(null);

    try {
      const db = getFirebaseFirestore();
      const reservationRef = doc(db, "reservations", editingReservation.id);
      const partySizeNumber = Number(editFormState.partySize);
      await updateDoc(reservationRef, {
        name: editFormState.name.trim(),
        email: editFormState.email.trim(),
        phone: editFormState.phone.trim(),
        date: editFormState.date,
        time: editFormState.time,
        partySize: Number.isNaN(partySizeNumber) ? 0 : partySizeNumber,
        occasion: editFormState.occasion.trim(),
        notes: editFormState.notes.trim(),
      });

      setReservationActionMessage("Reservation updated successfully.");
      setEditingReservation(null);
      setEditFormState(null);
    } catch (error) {
      console.error("Reservation update error:", error);
      setReservationActionError(
        "Unable to update the reservation. Please try again later."
      );
    } finally {
      setIsUpdatingReservation(false);
    }
  };

  const handleDeleteReservation = async (reservation: Reservation) => {
    const confirmed = window.confirm(
      `Delete reservation for ${reservation.name || "guest"}?`
    );
    if (!confirmed) {
      return;
    }

    setReservationActionMessage(null);
    setReservationActionError(null);

    try {
      const db = getFirebaseFirestore();
      await deleteDoc(doc(db, "reservations", reservation.id));
      setReservationActionMessage("Reservation deleted successfully.");
    } catch (error) {
      console.error("Reservation delete error:", error);
      setReservationActionError(
        "Unable to delete the reservation. Please try again later."
      );
    }
  };

  const handleClearReservationFilters = () => {
    setSearchTerm("");
    setMonthFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="min-h-screen bg-[#0b1410] text-white">
      <div className="mx-auto flex w-full max-w-7xl gap-10 px-6 py-12 lg:px-12">
        <aside className="flex w-64 flex-col gap-6 border-r border-white/10 pr-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">
              Admin Control
            </p>
            <h1 className="font-display text-2xl">Praana Studio</h1>
            <p className="text-xs text-white/50">
              Manage dishes, collections, and experience assets.
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-sm text-white/70">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !item.disabled && setActiveSection(item.id)}
                  className={clsx(
                    "flex flex-col rounded-2xl border border-transparent bg-white/0 px-4 py-3 text-left transition",
                    isActive && "border-white/30 bg-white/10 text-white",
                    !isActive && "hover:border-white/20 hover:bg-white/5",
                    item.disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                      <Icon className="h-4 w-4" strokeWidth={1.6} />
                    </span>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-white/50">{item.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 space-y-10">
          {activeSection === "reservations" ? (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur">
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                    Reservations · Inbox
                  </p>
                  <h2 className="font-display text-3xl text-white">
                    Review guest reservations
                  </h2>
                  <p className="text-sm text-white/60">
                    Monitor incoming bookings, confirm party sizes, and prep the hospitality team.
                  </p>
                </div>
                <button
                  onClick={() => setTestEmailOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:bg-white/10"
                >
                  Test email
                </button>
              </header>

              {reservationActionMessage ? (
                <div className="mt-4 rounded-2xl border border-emerald-300/40 bg-emerald-300/15 px-4 py-3 text-sm text-emerald-100">
                  {reservationActionMessage}
                </div>
              ) : null}

              {reservationActionError ? (
                <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                  {reservationActionError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                    placeholder="Search name, email, phone, or code"
                    className="w-full rounded-full border border-white/15 bg-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/35 focus:outline-none"
                  />
                </div>
                <select
                  value={monthFilter}
                  onChange={(event) => setMonthFilter(event.currentTarget.value)}
                  className="min-w-[160px] rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white focus:border-white/35 focus:outline-none"
                >
                  <option value="all" className="bg-[#101b15] text-white">
                    All months
                  </option>
                  {reservationMonths.map((month) => (
                    <option key={month} value={month} className="bg-[#101b15] text-white">
                      {new Date(`${month}-01`).toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                      })}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.currentTarget.value)}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white focus:border-white/35 focus:outline-none"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.currentTarget.value)}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white focus:border-white/35 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleClearReservationFilters}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/35 hover:text-white"
                >
                  Clear filters
                </button>
              </div>

              {reservationsError ? (
                <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                  {reservationsError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-4">
                {loadingReservations ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`reservation-skeleton-${index}`}
                      className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="h-4 w-44 rounded-full bg-white/10" />
                        <div className="h-3 w-80 rounded-full bg-white/10" />
                        <div className="h-3 w-64 rounded-full bg-white/10" />
                      </div>
                    </div>
                  ))
                ) : filteredReservations.length > 0 ? (
                  filteredReservations.map((reservation) => {
                    const createdAtLabel = reservation.createdAt
                      ? new Date(reservation.createdAt.seconds * 1000).toLocaleString()
                      : "Awaiting timestamp";

                    return (
                      <article
                        key={reservation.id}
                        className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-white/25 hover:bg-white/10"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                              #{reservation.id.slice(0, 8)}
                            </p>
                            <h3 className="font-display text-xl text-white">
                              {reservation.name || "Guest"}
                            </h3>
                            <p className="mt-1 text-xs text-white/40">Submitted {createdAtLabel}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-emerald-300/60 bg-emerald-300/15 px-3 py-1 text-xs text-emerald-100">
                              Party of {reservation.partySize}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditReservation(reservation)}
                              className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-white/40 hover:bg-white/10"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReservation(reservation)}
                              className="inline-flex items-center gap-1 rounded-full border border-red-400/30 px-3 py-1 text-xs text-red-200 transition hover:border-red-400/60 hover:bg-red-500/15"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
                          <p>
                            <span className="font-semibold text-white">Date</span>
                            <span className="ml-2">{reservation.date || "—"}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-white">Time</span>
                            <span className="ml-2">{reservation.time || "—"}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-white">Email</span>
                            <span className="ml-2">{reservation.email || "—"}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-white">Phone</span>
                            <span className="ml-2">{reservation.phone || "—"}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-white">Occasion</span>
                            <span className="ml-2">{reservation.occasion || "—"}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-white">Notes</span>
                            <span className="ml-2">{reservation.notes || "—"}</span>
                          </p>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-white/50">
                    No reservations match your filters. Adjust the search or date range.
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {activeSection === "menu" ? (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur">
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                    Menu · Library
                  </p>
                  <h2 className="font-display text-3xl text-white">
                    Curate your tasting narrative
                  </h2>
                  <p className="text-sm text-white/60">
                    Review every plate in the house, highlight signatures, or design
                    new experiences.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedTags([]);
                      resetForm();
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-300/90 px-5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300"
                  >
                    <Plus className="h-4 w-4" />
                    Add dish
                  </button>
                  <button
                    onClick={() => setTestEmailOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:bg-white/10"
                  >
                    Test email
                  </button>
                </div>
              </header>

              {formSuccess ? (
                <div className="mt-6 rounded-2xl border border-emerald-300/40 bg-emerald-300/15 px-4 py-3 text-sm text-emerald-100">
                  {formSuccess}
                </div>
              ) : null}

              {itemsError ? (
                <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                  {itemsError}
                  <div className="mt-2 text-xs text-red-200/80">
                    If you need relaxed rules for development, use the snippets provided
                    in the project notes.
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-6">
                {menuCategories.map((category) => {
                  const isActive = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={clsx(
                        "rounded-full border px-4 py-2 text-sm transition",
                        isActive
                          ? "border-emerald-300/70 bg-emerald-300/20 text-emerald-100"
                          : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-4">
                {loadingItems ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-2xl bg-white/10" />
                        <div className="flex-1 space-y-3">
                          <div className="h-3 w-32 rounded-full bg-white/10" />
                          <div className="h-5 w-48 rounded-full bg-white/15" />
                          <div className="h-3 w-full rounded-full bg-white/10" />
                        </div>
                        <div className="h-6 w-16 rounded-full bg-white/10" />
                      </div>
                    </div>
                  ))
                ) : filteredMenu.length > 0 ? (
                  filteredMenu.map((dish) => {
                    const priceLabel =
                      typeof dish.price === "number"
                        ? `$${dish.price.toFixed(2)}`
                        : dish.price ?? "—";

                    return (
                      <article
                        key={dish.id}
                        className="group flex items-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-white/25 hover:bg-white/10"
                      >
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                          {dish.imageUrl ? (
                            <Image
                              src={dish.imageUrl}
                              alt={dish.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="absolute inset-0 grid place-items-center text-xs text-white/40">
                              Photo
                            </span>
                          )}
                        </div>
                        <div className="flex w-full items-start justify-between gap-6">
                          <div className="flex-1">
                            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                              {dish.category}
                            </p>
                            <h3 className="font-display text-xl text-white">
                              {dish.name}
                            </h3>
                            {dish.description ? (
                              <p className="mt-2 text-sm leading-relaxed text-white/60">
                                {dish.description}
                              </p>
                            ) : null}
                            {dish.tags && dish.tags.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {dish.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full border border-emerald-200/40 bg-emerald-200/10 px-3 py-1 text-xs text-emerald-100"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                            {priceLabel}
                          </span>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-white/50">
                    No dishes under <span className="text-white/80">{selectedCategory}</span> yet. Create one to begin the story.
                  </div>
                )}
              </div>
            </section>
          ) : null}
          {activeSection === "collections" ? (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur">
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                    Collections · Experiences
                  </p>
                  <h2 className="font-display text-3xl text-white">
                    Shape seasonal tasting journeys
                  </h2>
                  <p className="text-sm text-white/60">
                    Draft new stories, align playlists, and signal the production crew before launch.
                  </p>
                </div>
                <button
                  onClick={() =>
                    window.alert(
                      "Collections tooling is en concepto. Comparte prioridades con el equipo de producto."
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:bg-white/10"
                >
                  Share feedback
                </button>
              </header>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {collectionTemplates.map((collection) => (
                  <article
                    key={collection.id}
                    className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/25 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                        {collection.focus}
                      </p>
                      <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-wide text-white/70">
                        {collection.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-xl text-white">
                        {collection.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">
                        {collection.description}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-xs text-white/60">
                      <span>Menu pairings, beverage sequencing, and mise en scene notes.</span>
                      <button
                        type="button"
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-white/35 hover:bg-white/10"
                      >
                        Open canvas
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/60">
                Integrate live staging when the collections CMS is ready. For now, align with the
                creative director to prioritize which experiences go live next.
              </div>
            </section>
          ) : null}
          {activeSection === "media" ? (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur">
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                    Media Library · Assets
                  </p>
                  <h2 className="font-display text-3xl text-white">
                    Keep the brand kit synchronized
                  </h2>
                  <p className="text-sm text-white/60">
                    Upload new campaign shots, approve retouched selects, and surface brand files instantly.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      window.alert(
                        "La subida de medios se activará cuando las reglas de almacenamiento estén listas."
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:bg-white/10"
                  >
                    Upload asset
                  </button>
                  <button
                    onClick={() => setTestEmailOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:bg-white/10"
                  >
                    Notify team
                  </button>
                </div>
              </header>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {mediaLibraryBuckets.map((bucket) => (
                  <article
                    key={bucket.id}
                    className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/25 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white/70">
                        <ImagePlus className="h-4 w-4" />
                      </span>
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
                        {bucket.assetCount} assets
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-white">{bucket.label}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">
                        {bucket.description}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between text-xs text-white/50">
                      <span>Updated {bucket.updatedAt}</span>
                      <button
                        type="button"
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-white/35 hover:bg-white/10"
                      >
                        Browse
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/60">
                Connect to Firebase Storage or your DAM once credentials land. Until then, use this layout to brief
                the creative team and track asset sources.
              </div>
            </section>
          ) : null}
        </main>
      </div>
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 py-10">
          <div className="relative w-full max-w-4xl rounded-3xl border border-white/15 bg-[#101b15] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsModalOpen(false);
              }}
              className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/10 p-2 text-white/70 transition hover:border-white/30 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 border-b border-white/10 pb-5">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Menu · New dish
              </p>
              <h2 className="font-display text-3xl text-white">
                Design a culinary moment
              </h2>
              <p className="text-sm text-white/60">
                Describe the flavor story, assign a category, and highlight special
                attributes.
              </p>
            </header>
            <form
              className="grid gap-8"
              onSubmit={handleCreateDish}
            >
              {formError ? (
                <div className="rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                  {formError}
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-white/70">Dish name</span>
                  <input
                    type="text"
                    placeholder="Example: Saffron Lotus Bisque"
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                    required
                    value={formState.name}
                    onChange={handleFieldChange("name")}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-white/70">Price (USD)</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                      <DollarSign className="h-4 w-4" />
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="48.00"
                      className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                      required
                      value={formState.price}
                      onChange={handleFieldChange("price")}
                    />
                  </div>
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm">
                <span className="text-white/70">Description</span>
                <textarea
                  rows={4}
                  placeholder="Describe textures, aromas, sourcing, and plating ritual."
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                  required
                  value={formState.description}
                  onChange={handleFieldChange("description")}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-white/70">Category</span>
                  <select
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                    value={formState.category}
                    onChange={handleFieldChange("category")}
                    required
                  >
                    <option value="" className="bg-[#101b15] text-white">
                      Select category
                    </option>
                    {menuCategories
                      .filter((category) => category !== "All Menu")
                      .map((category) => (
                      <option
                        key={category}
                        value={category}
                        className="bg-[#101b15] text-white"
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-white/70">Photography</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-white/15 file:px-4 file:py-2 file:text-sm file:text-white hover:border-white/40"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </label>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm text-white/70">
                  Highlight chips
                </legend>
                <div className="flex flex-wrap gap-3">
                  {menuTags.map((tag) => {
                    const isActive = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={clsx(
                          "rounded-full border px-4 py-2 text-sm transition",
                          isActive
                            ? "border-emerald-300/70 bg-emerald-300/20 text-emerald-100"
                            : "border-white/20 bg-white/5 text-white/70 hover:border-white/35 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-emerald-300 px-5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Publishing..." : "Publish dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {testEmailOpen ? (
        <ReservationTestEmail onClose={() => setTestEmailOpen(false)} />
      ) : null}
      {editingReservation && editFormState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 py-10">
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-[#101b15] p-8 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => {
                setEditingReservation(null);
                setEditFormState(null);
              }}
              className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/10 p-2 text-white/70 transition hover:border-white/30 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 border-b border-white/10 pb-5">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Reservations · Edit booking
              </p>
              <h2 className="font-display text-3xl text-white">
                Update reservation details
              </h2>
              <p className="text-sm text-white/60">
                Adjust guest contact info, schedule, party size, or notes.
              </p>
            </header>
            <form className="grid gap-6" onSubmit={handleUpdateReservation}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-white/70">Guest name</span>
                  <input
                    type="text"
                    value={editFormState.name}
                    onChange={handleEditFieldChange("name")}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-white/70">Email</span>
                  <input
                    type="email"
                    value={editFormState.email}
                    onChange={handleEditFieldChange("email")}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                    required
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-white/70">Phone</span>
                  <input
                    type="tel"
                    value={editFormState.phone}
                    onChange={handleEditFieldChange("phone")}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                    required
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="text-white/70">Date</span>
                    <input
                      type="date"
                      value={editFormState.date}
                      onChange={handleEditFieldChange("date")}
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="text-white/70">Time</span>
                    <input
                      type="time"
                      value={editFormState.time}
                      onChange={handleEditFieldChange("time")}
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                      required
                    />
                  </label>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-white/70">Party size</span>
                  <input
                    type="number"
                    min="1"
                    value={editFormState.partySize}
                    onChange={handleEditFieldChange("partySize")}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-white/70">Occasion</span>
                  <input
                    type="text"
                    value={editFormState.occasion}
                    onChange={handleEditFieldChange("occasion")}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-white/70">Notes</span>
                <textarea
                  rows={4}
                  value={editFormState.notes}
                  onChange={handleEditFieldChange("notes")}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                />
              </label>
              <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditingReservation(null);
                    setEditFormState(null);
                  }}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingReservation}
                  className="rounded-full bg-emerald-300 px-5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingReservation ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

