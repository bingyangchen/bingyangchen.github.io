import styles from "./Header.module.scss";

import React, { ReactElement } from "react";

import { Logo, NavTab, RoundButton } from "..";
import { useTranslation } from "../../i18n/context";
import type { TranslationDictionary } from "../../i18n/types";
import {
  IconBlogText,
  IconFilePerson,
  IconHomeblank,
  IconList,
  IconMedia,
} from "../../icons";

interface Props {
  dictionary: TranslationDictionary;
}

interface State {
  isSideMenuActive: boolean;
  isHeaderTransparent: boolean;
}

export class Header extends React.Component<Props, State> {
  public state: State;
  public constructor(props: Props) {
    super(props);
    this.state = {
      isSideMenuActive: false,
      isHeaderTransparent: true,
    };
  }
  public componentDidMount(): void {
    window.addEventListener("scroll", () => {
      this.setState({
        isHeaderTransparent: window.scrollY < window.innerHeight,
      });
    });
  }
  private get subpageTabs(): ReactElement[] {
    return [
      <NavTab
        tabIcon={<IconHomeblank sideLength="100%" />}
        tabName={this.props.dictionary.header.home}
        to="#home"
        onClick={() => {}}
        key="home"
      />,
      <NavTab
        tabIcon={<IconFilePerson sideLength="100%" />}
        tabName={this.props.dictionary.header.about}
        to="#about"
        onClick={() => {}}
        key="about"
      />,
      <NavTab
        tabIcon={<IconMedia sideLength="100%" />}
        tabName={this.props.dictionary.header.projects}
        to="#projects"
        onClick={() => {}}
        key="projects"
      />,
      <NavTab
        tabIcon={<IconBlogText sideLength="100%" />}
        tabName={this.props.dictionary.header.blog}
        to="#blog"
        onClick={() => {}}
        key="blog"
      />,
    ];
  }
  public render(): React.ReactNode {
    return (
      <>
        <header className={this.mainClass}>
          <Logo size="s" />
          <div className={styles.nav_bar_tab_container}>{this.subpageTabs}</div>
          <div className={styles.list_button_outer}>
            <RoundButton onClick={this.showSideMenu}>
              <IconList />
            </RoundButton>
          </div>
        </header>
        <div
          className={
            styles.side_menu + (this.state.isSideMenuActive ? ` ${styles.active}` : "")
          }
          onClick={this.hideSideMenu}
        >
          {this.subpageTabs}
        </div>
        <div
          className={
            styles.side_menu_background +
            (this.state.isSideMenuActive ? ` ${styles.active}` : "")
          }
          onClick={this.hideSideMenu}
        />
      </>
    );
  }
  private get mainClass(): string {
    return this.state.isHeaderTransparent
      ? `${styles.main} ${styles.transparent}`
      : styles.main;
  }
  private showSideMenu = (): void => {
    this.setState({ isSideMenuActive: true });
  };
  private hideSideMenu = (): void => {
    this.setState({ isSideMenuActive: false });
  };
}

export default function HeaderWrapper(props: Omit<Props, "dictionary">) {
  const { dictionary } = useTranslation();
  return <Header {...props} dictionary={dictionary} />;
}
