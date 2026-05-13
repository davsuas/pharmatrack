import { css } from "@/styled-system/css";

export default function MsrDashboard() {
  return (
    <div>
      <h2 className={css({ fontSize: "lg", fontWeight: "semibold", color: "fg.default", mb: "2" })}>
        Medical Sales Representative Dashboard
      </h2>
      <p className={css({ color: "fg.muted", fontSize: "sm" })}>
        Daily Routes, Visits, and Cycle progress.
      </p>
    </div>
  );
}
