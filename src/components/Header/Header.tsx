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
    is_hidden_bar_active: boolean;
    subpage_list: {
        tab_icon: any;
        tab_name: string;
        path: string;
    }[];
}

export default class Header extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {
            is_hidden_bar_active: false,
            subpage_list: [
                {
                    tab_icon: <IconHouseDoorFill side_length="100%" />,
                    tab_name: "HOME",
                    path: "#home",
                },
                {
                    tab_icon: <IconPerson side_length="95%" />,
                    tab_name: "ABOUT",
                    path: "#about",
                },
                {
                    tab_icon: <IconLayoutWtf side_length="95%" />,
                    tab_name: "PROJECTS",
                    path: "#projects",
                },
                {
                    tab_icon: <IconJournalBookmark side_length="95%" />,
                    tab_name: "BLOG",
                    path: ".",
                },
            ],
        };
    }
    public render(): React.ReactNode {
        return (
            <>
                <header className={styles.main}>
                    <FullLogo size="s" />
                    <div className={styles.subpage_list}>
                        {this.state.subpage_list.map((each, idx) => {
                            return (
                                <a key={idx} href={each.path}>
                                    {each.tab_name}
                                </a>
                            );
                        })}
                    </div>
                    <div className={styles.list_button_outer}>
                        <RoundButton onClick={this.show_main_function_var}>
                            <IconList side_length="30" />
                        </RoundButton>
                    </div>
                </header>
                <MainFunctionBar
                    is_active_in_short_screen={this.state.is_hidden_bar_active}
                    hide={this.hide_main_function_bar}
                >
                    {this.state.subpage_list.map((each, idx) => {
                        return (
                            <MainFunctionTab
                                tab_icon={each.tab_icon}
                                tab_name={each.tab_name}
                                to={`${each.path}`}
                                onClick={this.hide_main_function_bar}
                                key={idx}
                            />
                        );
                    })}
                </MainFunctionBar>
            </>
        );
    }
    private show_main_function_var = (): void => {
        this.setState({ is_hidden_bar_active: true });
    };
    private hide_main_function_bar = (): void => {
        this.setState({ is_hidden_bar_active: false });
    };
}
