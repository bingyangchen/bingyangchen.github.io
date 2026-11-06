import "./index.scss";
import "./print.scss";

import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { LanguageProvider } from "./i18n/context";
import MyRouter from "./router";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <LanguageProvider>
    <BrowserRouter>
      <MyRouter />
    </BrowserRouter>
  </LanguageProvider>,
);

serviceWorkerRegistration.unregister();
