import { create } from "zustand";
import { persist, createJSONStorage, devtools } from "zustand/middleware";

// ============================================================================
// TYPES
// ============================================================================

/** Source of the image: uploaded file or camera capture */
export type ImageSource = "upload" | "camera";

/** Types for expected values selected by the operator */
export type ExpectedData = {
  prodCode?: string;
  prodDesc?: string;
  lot?: string;
  expDate?: string;
  packDate?: string;
};

/** Item from ERP API response */
export type ErpItem = { id: number; value: string };

/** ERP response structure for expected data */
export type ErpResp = {
  prodCode: ErpItem[];
  prodDesc: ErpItem[];
  lot: ErpItem[];
  expDate: ErpItem[];
  packDate: ErpItem[];
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
export type OcrResult = {
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
  lotOk: boolean;
  expDateOk: boolean;
  packDateOk: boolean;
  barcodeDetectedOk: boolean;
  barcodeLegibleOk: boolean;
  barcodeOk: boolean;
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

  /** Expected values (prodCode, prodDesc, lot, expDate, packDate) selected by the operator */
  expectedData: ExpectedData;

  /** ERP response data cached to avoid redundant API calls */
  erpResp?: ErpResp;

  /** Flag to track if ERP data has been loaded */
  isErpRespLoaded: boolean;

  /** ID of the selected ERP item */
  selectedErpId?: string;

  /** Totals shown in the dashboard */
  counters: Counters;

  /** Unique processing instance ID */
  instanceId?: string;

  /** OCR result from processing */
  ocrResult: OcrResult;

  /** State of the Barcode process */
  barcode: BarcodeState;

  /** Validation results */
  validation: Validation;

  /** Processing state: error and loading */
  error?: string;
  loading: boolean;

  /** URLs of processed images returned by the backend */
  processedImgUrl?: string;
  ocrOverlayImgUrl?: string;
  barcodeOverlayImgUrl?: string;
  barcodeRoiImgUrl?: string;

  /** Report generation state: error and loading */
  reportError?: string;
  reportLoading: boolean;

  /** Report URL returned by the backend */
  reportUrl?: string;

  /** Actions */
  setImageSource: (src: ImageSource) => void;
  setFile: (f?: File) => void;
  setFilename: (name?: string) => void;
  setPreview: (url?: string) => void;
  setExpectedData: (patch: Partial<ExpectedData>) => void;
  setCounters: (patch: Partial<Counters>) => void;
  setOcrItems: (items: OcrItem[]) => void;
  setError: (msg?: string) => void;
  setLoading: (v: boolean) => void;
  clearInstanceId: () => void;
  clearOcr: () => void;
  incCounter: (key: keyof Counters, by?: number) => void;
  setProcessedImageUrl: (url: string) => void;
  setInstanceId: (id?: string) => void;
  setOcrOverlayImgUrl: (url: string) => void;
  setBarcodeOverlayImgUrl: (url: string) => void;
  setBarcodeRoiImgUrl: (url: string) => void;
  setBarcodeState: (barcode: BarcodeState) => void;
  clearBarcode: () => void;
  setLotOk: (ok: boolean) => void;
  setExpDateOk: (ok: boolean) => void;
  setPackDateOk: (ok: boolean) => void;
  setBarcodeDetectedOk: (ok: boolean) => void;
  setBarcodeLegibleOk: (ok: boolean) => void;
  setBarcodeOk: (ok: boolean) => void;
  setValidationSummary: (ok: boolean) => void;
  setValidation: (validation: Validation) => void;
  clearValidation: () => void;

  /** Report actions */
  setReportError: (msg?: string) => void;
  setReportLoading: (v: boolean) => void;
  setReportUrl: (url?: string) => void;
  clearReport: () => void;

  setErpResp: (data: ErpResp) => void;
  setIsErpRespLoaded: (loaded: boolean) => void;
  setSelectedErpId: (id?: string) => void;

  reset: () => void;
};

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const isDev = process.env.NODE_ENV !== "production";

/** Initial OCR result */
const INITIAL_OCR_RESULT: OcrResult = {
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
  packDateOk: false,
  lotOk: false,
  expDateOk: false,
  barcodeDetectedOk: false,
  barcodeLegibleOk: false,
  barcodeOk: false,
  validationSummary: false,
};

/** Helper to create a clean processed images state (all URLs undefined) */
const getCleanProcessedImagesState = () => ({
  processedImgUrl: undefined,
  ocrOverlayImgUrl: undefined,
  barcodeOverlayImgUrl: undefined,
  barcodeRoiImgUrl: undefined,
});

/** Helper to reset processing-related state while allowing a new preview */
const getProcessingResetState = (imagePreview?: string) => ({
  file: undefined,
  filename: undefined,
  imagePreview,
  instanceId: undefined,
  ocrResult: INITIAL_OCR_RESULT,
  barcode: INITIAL_BARCODE_STATE,
  validation: INITIAL_VALIDATION_STATE,
  error: undefined,
  loading: false,
  reportError: undefined,
  reportLoading: false,
  reportUrl: undefined,
  ...getCleanProcessedImagesState(),
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
        expectedData: {},
        erpResp: undefined,
        isErpRespLoaded: false,
        selectedErpId: undefined,
        counters: INITIAL_COUNTERS,
        instanceId: undefined,
        ocrResult: INITIAL_OCR_RESULT,
        barcode: INITIAL_BARCODE_STATE,
        validation: INITIAL_VALIDATION_STATE,
        error: undefined,
        loading: false,
        reportError: undefined,
        reportLoading: false,
        reportUrl: undefined,

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
                  ocrResult: INITIAL_OCR_RESULT,
                  barcode: INITIAL_BARCODE_STATE,
                  validation: INITIAL_VALIDATION_STATE,
                  error: undefined,
                  loading: false,
                  reportError: undefined,
                  reportLoading: false,
                  reportUrl: undefined,
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
              return getProcessingResetState(imagePreview);
            },
            false,
            "setPreview"
          ),

        // ========================================================================
        // EXPECTED VALUES & COUNTERS
        // ========================================================================

        setExpectedData: (patch) =>
          set(
            (state) => ({ expectedData: { ...state.expectedData, ...patch } }),
            false,
            "setExpectedData"
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
        // INSTANCE ID ACTIONS
        // ========================================================================
        setInstanceId: (id?: string) =>
          set({ instanceId: id }, false, "setInstanceId"),

        clearInstanceId: () =>
          set({ instanceId: undefined }, false, "clearInstanceId"),

        // ========================================================================
        // OCR ACTIONS
        // ========================================================================
        setOcrItems: (items) =>
          set(
            (s) => ({ ocrResult: { ...s.ocrResult, items } }),
            false,
            "setOcrItems"
          ),

        clearOcr: () =>
          set(
            { ocrResult: INITIAL_OCR_RESULT, error: undefined, loading: false },
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

        setLotOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, lotOk: ok } }),
            false,
            "setLotOk"
          ),

        setExpDateOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, expDateOk: ok } }),
            false,
            "setExpDateOk"
          ),

        setPackDateOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, packDateOk: ok } }),
            false,
            "setPackDateOk"
          ),

        setBarcodeDetectedOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, barcodeDetectedOk: ok } }),
            false,
            "setBarcodeDetectedOk"
          ),

        setBarcodeLegibleOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, barcodeLegibleOk: ok } }),
            false,
            "setBarcodeLegibleOk"
          ),

        setBarcodeOk: (ok: boolean) =>
          set(
            (s) => ({ validation: { ...s.validation, barcodeOk: ok } }),
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
        // REPORT ACTIONS
        // ========================================================================

        setReportError: (msg) =>
          set({ reportError: msg || undefined }, false, "setReportError"),

        setReportLoading: (reportLoading) =>
          set({ reportLoading }, false, "setReportLoading"),

        setReportUrl: (reportUrl) => set({ reportUrl }, false, "setReportUrl"),

        clearReport: () =>
          set(
            {
              reportError: undefined,
              reportLoading: false,
              reportUrl: undefined,
            },
            false,
            "clearReport"
          ),

        // ========================================================================
        // ERP DATA ACTIONS
        // ========================================================================

        setErpResp: (data: ErpResp) =>
          set({ erpResp: data }, false, "setErpResp"),

        setIsErpRespLoaded: (loaded: boolean) =>
          set({ isErpRespLoaded: loaded }, false, "setIsErpRespLoaded"),

        setSelectedErpId: (id?: string) =>
          set({ selectedErpId: id }, false, "setSelectedErpId"),

        // ========================================================================
        // RESET
        // ========================================================================

        reset: () => {
          revokeObjectURL(get().imagePreview);
          set(
            {
              ...getProcessingResetState(),
              expectedData: {},
              selectedErpId: undefined,
              counters: INITIAL_COUNTERS,
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
          expectedData: s.expectedData,
          counters: s.counters,
          imageSource: s.imageSource,
          erpResp: s.erpResp,
          isErpRespLoaded: s.isErpRespLoaded,
          selectedErpId: s.selectedErpId,
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
