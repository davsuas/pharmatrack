import { css } from "@/styled-system/css";

export default function PmDashboard() {
  return (
    <div>
      <h2 className={css({ fontSize: "lg", fontWeight: "semibold", color: "fg.default", mb: "2" })}>
        Product Manager Dashboard
      </h2>
      <p className={css({ color: "fg.muted", fontSize: "sm" })}>
        Campaigns, Promotional Grids, and Cycle configuration.
      </p>
    </div>
  );
}
