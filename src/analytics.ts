// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

const GA_MEASUREMENT_ID = "G-61FSCXPXET";
const PRODUCTION_HOSTNAME = "mertcookimg.github.io";
const PRODUCTION_PATHNAME = "/Open_Duck_Mini_Viewer/";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
};

/**
 * Loads Google Analytics only on the canonical GitHub Pages deployment.
 *
 * Keeping this check at runtime prevents local builds and sites deployed from
 * forks from sending data to the original project's GA4 property.
 */
export function initializeGoogleAnalytics(): void {
  if (
    window.location.hostname !== PRODUCTION_HOSTNAME ||
    window.location.pathname !== PRODUCTION_PATHNAME
  ) {
    return;
  }

  const analyticsWindow = window as AnalyticsWindow;
  const dataLayer = (analyticsWindow.dataLayer ??= []);
  const gtag = (...args: unknown[]) => {
    dataLayer.push(args);
  };

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.append(script);
}
