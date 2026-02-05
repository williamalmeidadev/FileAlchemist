export type Language = "en" | "pt";

const STORAGE_KEY = "filealchemist-lang";

export function detectLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language.toLowerCase();
  return lang.startsWith("pt") ? "pt" : "en";
}

export function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored === "en" || stored === "pt") return stored;
  return detectLanguage();
}

export function persistLanguage(language: Language) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, language);
}

export const COPY = {
  en: {
    brandTitle: "FileAlchemist",
    brandSubtitle: "Convert PNG/JPG/WebP locally. No uploads.",
    dropTitle: "Drop files",
    inQueue: "in queue",
    dropHelper: "Supported: PNG, JPG/JPEG, WebP. Processing stays on your device.",
    dropActionPrimary: "Convert",
    dropActionConverting: "Converting…",
    dropActionZip: "Download ZIP",
    dropActionZipping: "Zipping…",
    dropActionClear: "Clear",
    queueSummaryTitle: "Queue summary",
    queueTotal: "Total",
    queuePending: "Pending",
    queueDone: "Done",
    queueErrors: "Errors",
    progressProcessed: "processed",
    emptyTitle: "No files yet",
    emptySubtitle: "Drop PNG/JPG/WebP to start. Everything stays on your device.",
    dropzoneTitle: "Drop images here",
    dropzoneSubtitle: "or click to browse",
    settingsTitle: "Settings",
    outputFormat: "Output format",
    quality: "Quality",
    jpegBackground: "JPEG background",
    width: "Width (px)",
    height: "Height (px)",
    maxDimension: "Max dimension (px)",
    resetSettings: "Reset settings",
    queueTitle: "Queue",
    download: "Download",
    remove: "Remove",
    footer: "Developed by William Almeida",
    themeToggle: "Toggle theme",
    languageToggle: "Language",
  },
  pt: {
    brandTitle: "FileAlchemist",
    brandSubtitle: "Converta PNG/JPG/WebP localmente. Sem uploads.",
    dropTitle: "Adicionar arquivos",
    inQueue: "na fila",
    dropHelper: "Suporta: PNG, JPG/JPEG, WebP. Tudo fica no seu dispositivo.",
    dropActionPrimary: "Converter",
    dropActionConverting: "Convertendo…",
    dropActionZip: "Baixar ZIP",
    dropActionZipping: "Gerando ZIP…",
    dropActionClear: "Limpar",
    queueSummaryTitle: "Resumo da fila",
    queueTotal: "Total",
    queuePending: "Pendentes",
    queueDone: "Concluídos",
    queueErrors: "Erros",
    progressProcessed: "processados",
    emptyTitle: "Sem arquivos",
    emptySubtitle: "Arraste PNG/JPG/WebP para começar. Tudo fica no seu dispositivo.",
    dropzoneTitle: "Solte as imagens aqui",
    dropzoneSubtitle: "ou clique para buscar",
    settingsTitle: "Configurações",
    outputFormat: "Formato de saída",
    quality: "Qualidade",
    jpegBackground: "Fundo do JPEG",
    width: "Largura (px)",
    height: "Altura (px)",
    maxDimension: "Dimensão máxima (px)",
    resetSettings: "Resetar",
    queueTitle: "Fila",
    download: "Baixar",
    remove: "Remover",
    footer: "Desenvolvido por William Almeida",
    themeToggle: "Alternar tema",
    languageToggle: "Idioma",
  },
} as const;
