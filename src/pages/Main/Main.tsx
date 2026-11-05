import styles from "./Main.module.scss";

import { Outlet } from "react-router-dom";

import { Footer, Header } from "../../components";

export default function Main() {
  return (
    <div className={`${styles.main} site-layout`}>
      <Header />
      <main id="main-content" className="main-outlet-slot" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
