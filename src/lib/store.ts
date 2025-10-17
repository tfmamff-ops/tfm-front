import { create } from "zustand";
import { persist, createJSONStorage, devtools } from "zustand/middleware";

/** Source of the image: uploaded file or camera capture */
export type ImageSource = "upload" | "camera";

/** Types for expected values selected by the operator */
export type Expected = {
  batch?: string;
  order?: string;
  expiry?: string;
};

/** Aggregate counters displayed in the UI */
export type Counters = {
  inspected: number;
  ok: number;
  rejected: number;
};

/** OCR item */
export type OcrItem = { id: string; text: string };

/** State of the OCR process: items, error and loading */
export type OcrState = {
  items: OcrItem[];
  error?: string;
  loading: boolean;
};

/** Global application state (Zustand store) */
type AppState = {
  /** How the current image was provided */
  imageSource: ImageSource;

  /** File uploaded or captured from the camera */
  file?: File;

  /** Object URL for the current image preview */
  imagePreview?: string;

  /** Expected values (batch/order/expiry) selected by the operator */
  expected: Expected;

  /** Totals shown in the dashboard */
  counters: Counters;

  /** State of the OCR process: items, error and loading */
  ocr: OcrState;

  processedImgUrl?: string;

  /** Actions */
  setImageSource: (src: ImageSource) => void;
  setFile: (f?: File) => void;
  setPreview: (url?: string) => void;
  setExpected: (patch: Partial<Expected>) => void;
  setCounters: (patch: Partial<Counters>) => void;
  setOcrItems: (items: OcrItem[]) => void;
  setOcrError: (msg?: string) => void;
  setOcrLoading: (v: boolean) => void;
  clearOcr: () => void;
  incCounter: (key: keyof Counters, by?: number) => void;
  setProcessedImageUrl: (url: string) => void;
  reset: () => void;
};

const isDev = process.env.NODE_ENV !== "production";

// SSR-safe storage: return localStorage in browser, otherwise a noop storage
const getStorage = () => {
  const storage = (globalThis as any)?.localStorage as Storage | undefined;
  if (storage !== undefined) {
    return storage;
  }
  // noop storage for server-side where localStorage is not available
  const noop: Storage = {
    length: 0,
    clear: () => {},
    getItem: () => null,
    key: () => null,
    removeItem: () => {},
    setItem: () => {},
  };
  return noop;
};

/** App-wide store (no "use client" here) */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        imageSource: "upload",
        file: undefined,
        imagePreview: undefined,
        expected: {},
        counters: { inspected: 0, ok: 0, rejected: 0 },
        ocr: { items: [], error: undefined, loading: false },

        setImageSource: (src) =>
          set(
            (s) => {
              // when switching source, clear previous file/preview to keep it exclusive
              if (s.imageSource !== src) {
                if (s.imagePreview) URL.revokeObjectURL(s.imagePreview);
                return {
                  imageSource: src,
                  file: undefined,
                  imagePreview: undefined,
                  // Also reset OCR and processed image when changing source
                  ocr: { items: [], error: undefined, loading: false },
                  processedImgUrl: undefined,
                } as Partial<AppState>;
              }
              return { imageSource: src } as Partial<AppState>;
            },
            false,
            "setImageSource"
          ),

        setFile: (file) => set({ file }, false, "setFile"),

        setPreview: (imagePreview) =>
          set(
            (state) => {
              try {
                if (state.imagePreview && state.imagePreview !== imagePreview) {
                  URL.revokeObjectURL(state.imagePreview);
                }
              } catch (e) {
                console.debug("revokeObjectURL failed", e);
              }
              // When preview changes, reset OCR and processed image so UI returns to initial state
              return {
                imagePreview,
                ocr: { items: [], error: undefined, loading: false },
                processedImgUrl: undefined,
              } as Partial<AppState>;
            },
            false,
            "setPreview"
          ),

        setExpected: (patch) =>
          set(
            (state) => ({ expected: { ...state.expected, ...patch } }),
            false,
            "setExpected"
          ),

        setCounters: (patch) =>
          set(
            (state) => ({ counters: { ...state.counters, ...patch } }),
            false,
            "setCounters"
          ),

        setOcrItems: (items) =>
          set((s) => ({ ocr: { ...s.ocr, items } }), false, "setOcrItems"),

        setOcrError: (msg) =>
          set((s) => ({ ocr: { ...s.ocr, error: msg } }), false, "setOcrError"),

        setOcrLoading: (v) =>
          set(
            (s) => ({ ocr: { ...s.ocr, loading: v } }),
            false,
            "setOcrLoading"
          ),

        setProcessedImageUrl: (url) =>
          set({ processedImgUrl: url }, false, "setProcessedImageUrl"),

        clearOcr: () =>
          set(
            (s) => ({ ocr: { items: [], error: undefined, loading: false } }),
            false,
            "clearOcr"
          ),

        incCounter: (key, by = 1) =>
          set(
            (state) => ({
              counters: { ...state.counters, [key]: state.counters[key] + by },
            }),
            false,
            "incCounter"
          ),

        reset: () => {
          const prev = get().imagePreview;
          if (prev) URL.revokeObjectURL(prev);
          set(
            {
              imagePreview: undefined,
              file: undefined,
              expected: {},
              counters: { inspected: 0, ok: 0, rejected: 0 },
              ocr: { items: [], error: undefined, loading: false },
              processedImgUrl: undefined,
            },
            false,
            "reset"
          );
        },
      }),
      {
        name: "tfm-app-store",
        storage: createJSONStorage(() => getStorage()),
        // Persist only serializable slices
        partialize: (s) => ({
          expected: s.expected,
          counters: s.counters,
          imageSource: s.imageSource,
        }),
      }
    ),
    {
      name: "TFM App Store",
      enabled: isDev,
      ...(isDev && { trace: true, traceLimit: 25 }),
    }
  )
);

/** Optional helper to clear persisted data and reset the in-memory store */
export const clearPersistedStore = () => {
  useAppStore.persist.clearStorage();
  useAppStore.getState().reset();
};
