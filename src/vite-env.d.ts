/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_WAGMI_PROJECT_ID: string;
  /** Hedera account that receives scheduled stream deposits, e.g. `0.0.12345`. */
  readonly VITE_HEDERA_ACCOUNT_ID: string;
  /** Optional mirror node override; defaults to the public testnet node. */
  readonly VITE_HEDERA_MIRROR_NODE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
