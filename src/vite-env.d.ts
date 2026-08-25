/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WAGMI_PROJECT_ID: string;
  /** Hedera account that receives scheduled stream deposits, e.g. `0.0.12345`. */
  readonly VITE_HEDERA_ACCOUNT_ID: string;
  /** Only needed when the API is not served from the same origin. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
