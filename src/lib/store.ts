import { create } from "zustand";
import { persist, createJSONStorage, devtools } from "zustand/middleware";

// ============================================================================
// TYPES
// ============================================================================

/** Source of the image: uploaded file or camera capture */
export type ImageSource = "upload" | "camera";

/** Types for expected values selected by the operator */
export type Expected = {
  item?: string;
  itemDesc?: string;
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

/** OCR result from processing */
export type Ocr = {
  items: OcrItem[];
};

export type BarcodeState = {
  barcodeDetected: boolean;
  barcodeLegible: boolean;
  decodedValue: string;
  barcodeSymbology: string;
  barcodeBox: number[];
};

export type Validation = {
  orderOK: boolean;
  batchOK: boolean;
  expiryOK: boolean;
  barcodeDetectedOK: boolean;
  barcodeLegibleOK: boolean;
  barcodeOK: boolean;
  validationSummary: boolean;
};

/** Logged-in user and client context to send to backend APIs */
// Auth/user types are defined in src/lib/auth-store.ts

/** Global application state (Zustand store) */
type AppState = {
  /** How the current image was provided */
  imageSource: ImageSource;

  /** File uploaded or captured from the camera */
  file?: File;
  filename?: string;

  /** Object URL for the current image preview */
  imagePreview?: string;

  /** Expected values (batch/order/expiry) selected by the operator */
  expected: Expected;

  /** Totals shown in the dashboard */
  counters: Counters;

  /** OCR result from processing */
  ocr: Ocr;

  /** State of the Barcode process */
  barcode: BarcodeState;

  /** Validation results */
  validation: Validation;

  /** Processing state: error and loading */
  error?: string;
  loading: boolean;

  /** URLs of processed images returned from the backend */
  processedImgUrl?: string;
  ocrOverlayImgUrl?: string;
  barcodeOverlayImgUrl?: string;
  barcodeRoiImgUrl?: string;

  /** Actions */
  setImageSource: (src: ImageSource) => void;
  setFile: (f?: File) => void;
  setFilename: (name?: string) => void;
  setPreview: (url?: string) => void;
  setExpected: (patch: Partial<Expected>) => void;
  setCounters: (patch: Partial<Counters>) => void;
  setOcrItems: (items: OcrItem[]) => void;
  setError: (msg?: string) => void;
  setLoading: (v: boolean) => void;
  clearOcr: () => void;
  incCounter: (key: keyof Counters, by?: number) => void;
  setProcessedImageUrl: (url: string) => void;
  setOcrOverlayImgUrl: (url: string) => void;
  setBarcodeOverlayImgUrl: (url: string) => void;
  setBarcodeRoiImgUrl: (url: string) => void;
  setBarcodeState: (barcode: BarcodeState) => void;
  clearBarcode: () => void;
  setOrderOk: (ok: boolean) => void;
  setBatchOk: (ok: boolean) => void;
  setExpiryOk: (ok: boolean) => void;
  setBarcodeDetectedOk: (ok: boolean) => void;
  setBarcodeLegibleOk: (ok: boolean) => void;
  setBarcodeOk: (ok: boolean) => void;
  setValidationSummary: (ok: boolean) => void;
  setValidation: (validation: Validation) => void;
  clearValidation: () => void;

  reset: () => void;
};

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const isDev = process.env.NODE_ENV !== "production";

/** Initial OCR result */
const INITIAL_OCR: Ocr = {
  items: [],
};

/** Initial counters */
const INITIAL_COUNTERS: Counters = {
  inspected: 0,
  ok: 0,
  rejected: 0,
};

/** Initial state for Barcode */
const INITIAL_BARCODE_STATE: BarcodeState = {
  barcodeDetected: false,
  barcodeLegible: false,
  decodedValue: "",
  barcodeSymbology: "",
  barcodeBox: [],
};

/** Initial state for Validation */
const INITIAL_VALIDATION_STATE: Validation = {
  orderOK: false,
  batchOK: false,
  expiryOK: false,
  barcodeDetectedOK: false,
  barcodeLegibleOK: false,
  barcodeOK: false,
  validationSummary: false,
};

/** Helper to create a clean processed images state (all URLs undefined) */
const getCleanProcessedImagesState = () => ({
  processedImgUrl: undefined,
  ocrOverlayImgUrl: undefined,
  barcodeOverlayImgUrl: undefined,
  barcodeRoiImgUrl: undefined,
});

/** Helper to safely revoke object URL */
const revokeObjectURL = (url?: string) => {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch (e) {
    console.debug("revokeObjectURL failed", e);
  }
};

/** SSR-safe storage: return sessionStorage in browser, otherwise a noop storage */
const getStorage = (): Storage => {
  const w = (globalThis as unknown as { window?: Window }).window;
  if (w?.sessionStorage) {
    return w.sessionStorage;
  }
  // Noop storage for server-side where sessionStorage is not available
  return {
    length: 0,
    clear: () => {},
    getItem: () => null,
    key: () => null,
    removeItem: () => {},
    setItem: () => {},
  };
};

// ============================================================================
// STORE
// ============================================================================

/** App-wide store (no "use client" here) */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        imageSource: "upload",
        file: undefined,
        filename: undefined,
        imagePreview: undefined,
        expected: {},
        counters: INITIAL_COUNTERS,
        ocr: INITIAL_OCR,
        barcode: INITIAL_BARCODE_STATE,
        validation: INITIAL_VALIDATION_STATE,
        error: undefined,
        loading: false,

        // ========================================================================
        // IMAGE SOURCE & FILE ACTIONS
        // ========================================================================

        setImageSource: (src) =>
          set(
            (s) => {
              // When switching source, clear previous file/preview to keep it exclusive
              if (s.imageSource !== src) {
                revokeObjectURL(s.imagePreview);
                return {
                  imageSource: src,
                  file: undefined,
                  filename: undefined,
                  imagePreview: undefined,
                  ocr: INITIAL_OCR,
                  barcode: INITIAL_BARCODE_STATE,
                  validation: INITIAL_VALIDATION_STATE,
                  error: undefined,
                  loading: false,
                  ...getCleanProcessedImagesState(),
                };
              }
              return { imageSource: src };
            },
            false,
            "setImageSource"
          ),

        setFile: (file) => set({ file }, false, "setFile"),

        setFilename: (name) => set({ filename: name }, false, "setFilename"),

        setPreview: (imagePreview) =>
          set(
            (state) => {
              // Clean up previous preview URL if different
              if (state.imagePreview !== imagePreview) {
                revokeObjectURL(state.imagePreview);
              }
              // When preview changes, reset OCR and processed images
              return {
                imagePreview,
                ocr: INITIAL_OCR,
                barcode: INITIAL_BARCODE_STATE,
                validation: INITIAL_VALIDATION_STATE,
                error: undefined,
                loading: false,
                ...getCleanProcessedImagesState(),
              };
            },
            false,
            "setPreview"
          ),

        // ========================================================================
        // EXPECTED VALUES & COUNTERS
        // ========================================================================

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

        incCounter: (key, by = 1) =>
          set(
            (state) => ({
              counters: { ...state.counters, [key]: state.counters[key] + by },
            }),
            false,
            "incCounter"
          ),

        // ========================================================================
        // OCR ACTIONS
        // ========================================================================
        setOcrItems: (items) =>
          set((s) => ({ ocr: { ...s.ocr, items } }), false, "setOcrItems"),

        clearOcr: () =>
          set(
            { ocr: INITIAL_OCR, error: undefined, loading: false },
            false,
            "clearOcr"
          ),

        // ========================================================================
        // PROCESS ACTIONS (global loading/error)
        // ========================================================================
        setError: (msg) => set({ error: msg || undefined }, false, "setError"),
        setLoading: (v) => set({ loading: v }, false, "setLoading"),

        // ========================================================================
        // PROCESSED IMAGE URLS
        // ========================================================================

        setProcessedImageUrl: (url) =>
          set({ processedImgUrl: url }, false, "setProcessedImageUrl"),

        setOcrOverlayImgUrl: (url) =>
          set({ ocrOverlayImgUrl: url }, false, "setOcrOverlayImgUrl"),

        setBarcodeOverlayImgUrl: (url) =>
          set({ barcodeOverlayImgUrl: url }, false, "setBarcodeOverlayImgUrl"),

        setBarcodeRoiImgUrl: (url) =>
          set({ barcodeRoiImgUrl: url }, false, "setBarcodeRoiImgUrl"),

        // ========================================================================
        // BARCODE ACTIONS
        // ========================================================================

        setBarcodeState: (barcode) =>
          set({ barcode }, false, "setBarcodeState"),

        clearBarcode: () =>
          set({ barcode: INITIAL_BARCODE_STATE }, false, "clearBarcode"),

        // ========================================================================
        // VALIDATION ACTIONS
        // ========================================================================

        setOrderOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, orderOK: ok } }),
            false,
            "setOrderOk"
          ),

        setBatchOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, batchOK: ok } }),
            false,
            "setBatchOk"
          ),

        setExpiryOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, expiryOK: ok } }),
            false,
            "setExpiryOk"
          ),

        setBarcodeDetectedOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, barcodeDetectedOK: ok } }),
            false,
            "setBarcodeDetectedOk"
          ),

        setBarcodeLegibleOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, barcodeLegibleOK: ok } }),
            false,
            "setBarcodeLegibleOk"
          ),

        setBarcodeOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, barcodeOK: ok } }),
            false,
            "setBarcodeOk"
          ),

        setValidationSummary: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, validationSummary: ok } }),
            false,
            "setValidationSummary"
          ),

        setValidation: (validation: Validation) =>
          set({ validation }, false, "setValidation"),

        clearValidation: () =>
          set(
            { validation: INITIAL_VALIDATION_STATE },
            false,
            "clearValidation"
          ),

        // ========================================================================
        // RESET
        // ========================================================================

        reset: () => {
          revokeObjectURL(get().imagePreview);
          set(
            {
              imagePreview: undefined,
              file: undefined,
              filename: undefined,
              expected: {},
              counters: INITIAL_COUNTERS,
              ocr: INITIAL_OCR,
              error: undefined,
              loading: false,
              barcode: INITIAL_BARCODE_STATE,
              validation: INITIAL_VALIDATION_STATE,
              ...getCleanProcessedImagesState(),
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

// ============================================================================
// HELPERS
// ============================================================================

/** Optional helper to clear persisted data and reset the in-memory store */
export const clearPersistedStore = () => {
  useAppStore.persist.clearStorage();
  useAppStore.getState().reset();
};
