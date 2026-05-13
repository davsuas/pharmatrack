import { css } from "@/styled-system/css";

export default function DmDashboard() {
  return (
    <div>
      <h2 className={css({ fontSize: "lg", fontWeight: "semibold", color: "fg.default", mb: "2" })}>
        District Manager Dashboard
      </h2>
      <p className={css({ color: "fg.muted", fontSize: "sm" })}>
        Territory KPIs, team monitoring, and Route configuration.
      </p>
    </div>
  );
}
