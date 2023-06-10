import styles from "./Header.module.scss";

import React from "react";

import RoundButton from "../RoundButton/RoundButton";
import FullLogo from "../FullLogo/FullLogo";
import IconList from "../Icons/IconList";
import MainFunctionBar from "../MainFunctionBar/MainFunctionBar";
import MainFunctionTab from "../MainFunctionTab/MainFunctionTab";
import IconHouseDoorFill from "../Icons/IconHouseDoorFill";
import IconLayoutWtf from "../Icons/IconLayoutWtf";
import IconJournalBookmark from "../Icons/IconJournalBookmark";
import IconPerson from "../Icons/IconPerson";

interface Props {}

interface State {
    isHiddenBarActive: boolean;
    subpageList: {
        tabIcon: any;
        tabName: string;
        path: string;
    }[];
    shouldHeaderTransparent: boolean;
}

export default class Header extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {
            isHiddenBarActive: false,
            subpageList: [
                {
                    tabIcon: <IconHouseDoorFill sideLength="100%" />,
                    tabName: "HOME",
                    path: "/#home",
                },
                {
                    tabIcon: <IconPerson sideLength="95%" />,
                    tabName: "ABOUT",
                    path: "/#about",
                },
                {
                    tabIcon: <IconLayoutWtf sideLength="95%" />,
                    tabName: "PROJECTS",
                    path: "/#projects",
                },
                {
                    tabIcon: <IconJournalBookmark sideLength="95%" />,
                    tabName: "BLOG",
                    path: "/#blog",
                },
            ],
            shouldHeaderTransparent: true,
        };
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
                        {this.state.subpageList.map((each, idx) => {
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
                <MainFunctionBar
                    isActiveInShortScreen={this.state.isHiddenBarActive}
                    hide={this.hideMainFunctionBar}
                >
                    {this.state.subpageList.map((each, idx) => {
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
                </MainFunctionBar>
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
