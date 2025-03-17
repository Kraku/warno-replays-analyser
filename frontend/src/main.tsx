
import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App";
import { ConfigProvider, theme } from "antd";

const container = document.getElementById("root");

const root = createRoot(container!);
const { darkAlgorithm, compactAlgorithm } = theme;

root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: [darkAlgorithm, compactAlgorithm],
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
