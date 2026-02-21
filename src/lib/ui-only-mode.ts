export const UI_ONLY_MODE =
  process.env.NEXT_PUBLIC_UI_ONLY_MODE === "true" ||
  (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_UI_ONLY_MODE !== "false")
