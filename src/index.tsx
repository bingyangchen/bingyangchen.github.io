import "./index.scss";
import "./print.scss";

import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { LanguageProvider } from "./i18n/context";
import reportWebVitals from "./reportWebVitals";
import MyRouter from "./router";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  // <React.StrictMode>
  <LanguageProvider>
    <BrowserRouter>
      <MyRouter />
    </BrowserRouter>
  </LanguageProvider>,
  // </React.StrictMode>
);

serviceWorkerRegistration.unregister();

reportWebVitals();
