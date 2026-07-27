// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initializeGoogleAnalytics } from "./analytics";
import "./index.css";

initializeGoogleAnalytics();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
