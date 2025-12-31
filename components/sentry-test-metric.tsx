"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export function SentryTestMetric() {
  useEffect(() => {
    // Send a test metric on mount
    console.log("Sending Sentry test metric...");
    Sentry.metrics.count("test_metric", 1, {
      attributes: { environment: "development" },
    });
  }, []);

  return null;
}
