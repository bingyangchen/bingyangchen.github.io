import "./index.scss";
import "./print.scss";

import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { LanguageSwitcher } from "./components/LanguageSwitcher/LanguageSwitcher";
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
      <LanguageSwitcher />
    </BrowserRouter>
  </LanguageProvider>,
  // </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
