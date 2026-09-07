import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";

const SurveyApp = lazy(() => import("./App"));
const MarketPreadmissionApp = lazy(() => import("./market/MarketPreadmissionApp"));

const isMarketPreadmission = import.meta.env.VITE_SURVEY_BRAND === "market-preadmission";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>正在加载…</main>}>
      {isMarketPreadmission ? <MarketPreadmissionApp /> : <SurveyApp />}
    </Suspense>
  </StrictMode>,
);
