/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SURVEY_BRAND?: string;
  readonly VITE_CLOUDBASE_ENV_ID?: string;
  readonly VITE_CLOUDBASE_ACCESS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
