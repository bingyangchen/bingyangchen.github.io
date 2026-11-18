import styles from "./SiteLayout.module.scss";

import { Outlet } from "react-router-dom";

import { Footer, Header } from "../../components";

export default function SiteLayout() {
  return (
    <div
      className={`${styles.layout} site-layout`}
      onContextMenu={(event) => {
        if (event.target instanceof Element && event.target.closest("img, svg"))
          event.preventDefault();
      }}
    >
      <Header />
      <main id="main-content" className="main-outlet-slot" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
