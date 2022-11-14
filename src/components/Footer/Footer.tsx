import styles from "./Footer.module.scss";

import React from "react";

interface Props {}

interface State {}

export default class Footer extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public render(): React.ReactNode {
        return (
            <div className={styles.main}>
                Copyright © {new Date().getFullYear()} 陳秉洋 (Jamison Chen) All
                rights reserved
            </div>
        );
    }
}
