import { css } from "@/styled-system/css";

export default function AdminDashboard() {
  return (
    <div>
      <h2 className={css({ fontSize: "lg", fontWeight: "semibold", color: "fg.default", mb: "2" })}>
        Admin Dashboard
      </h2>
      <p className={css({ color: "fg.muted", fontSize: "sm" })}>
        System configuration, user provisioning, and Cycle management.
      </p>
    </div>
  );
}
