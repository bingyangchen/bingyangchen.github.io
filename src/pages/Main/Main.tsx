import styles from "./Main.module.scss";

import { Outlet } from "react-router-dom";

import { Footer, Header } from "../../components";

export default function Main() {
  return (
    <main className={styles.main}>
      <Header />
      <div className="main-outlet-slot">
        <Outlet />
      </div>
      <Footer />
    </main>
  );
}
