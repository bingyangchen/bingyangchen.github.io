import styles from "./Header.module.scss";

import React from "react";

import { RoundButton, FullLogo, NavigationBar, MainFunctionTab } from "..";
import {
    IconList,
    IconHouseDoorFill,
    IconLayoutWtf,
    IconJournalBookmark,
    IconPerson,
} from "../../icons";

interface Props {}

interface State {
    isHiddenBarActive: boolean;
    shouldHeaderTransparent: boolean;
}

export default class Header extends React.Component<Props, State> {
    public state: State;
    private subpageList: {
        tabIcon: any;
        tabName: string;
        path: string;
    }[];
    public constructor(props: Props) {
        super(props);
        this.state = {
            isHiddenBarActive: false,
            shouldHeaderTransparent: true,
        };
        this.subpageList = [
            {
                tabIcon: <IconHouseDoorFill sideLength="100%" />,
                tabName: "HOME",
                path: "#home",
            },
            {
                tabIcon: <IconPerson sideLength="95%" />,
                tabName: "ABOUT",
                path: "#about",
            },
            {
                tabIcon: <IconLayoutWtf sideLength="95%" />,
                tabName: "PROJECTS",
                path: "#projects",
            },
            {
                tabIcon: <IconJournalBookmark sideLength="95%" />,
                tabName: "BLOG",
                path: "#blog",
            },
        ];
    }
    public componentDidMount(): void {
        window.addEventListener("scroll", () => {
            this.setState({
                shouldHeaderTransparent: window.scrollY < window.innerHeight,
            });
        });
    }
    public render(): React.ReactNode {
        return (
            <>
                <header className={this.mainClass}>
                    <FullLogo size="s" />
                    <div className={styles.subpage_list}>
                        {this.subpageList.map((each, idx) => {
                            return (
                                <a key={idx} href={each.path}>
                                    {each.tabName}
                                </a>
                            );
                        })}
                    </div>
                    <div className={styles.list_button_outer}>
                        <RoundButton onClick={this.showMainFunctionBar}>
                            <IconList sideLength="30" />
                        </RoundButton>
                    </div>
                </header>
                <NavigationBar
                    isActive={this.state.isHiddenBarActive}
                    hide={this.hideMainFunctionBar}
                >
                    {this.subpageList.map((each, idx) => {
                        return (
                            <MainFunctionTab
                                tabIcon={each.tabIcon}
                                tabName={each.tabName}
                                to={`${each.path}`}
                                onClick={this.hideMainFunctionBar}
                                key={idx}
                            />
                        );
                    })}
                </NavigationBar>
            </>
        );
    }
    private get mainClass(): string {
        if (this.state.shouldHeaderTransparent) {
            return `${styles.main} ${styles.transparent}`;
        }
        return styles.main;
    }
    private showMainFunctionBar = (): void => {
        this.setState({ isHiddenBarActive: true });
    };
    private hideMainFunctionBar = (): void => {
        this.setState({ isHiddenBarActive: false });
    };
}
