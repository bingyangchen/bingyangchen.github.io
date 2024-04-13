import React from "react";

import { asIcon } from "./IconLayout";

interface Props {}

interface State {}

class IconList extends React.Component<Props, State> {
    public state: State;

    public constructor(props: Props) {
        super(props);
        this.state = {};
    }

    public render(): React.ReactNode {
        return (
            <>
                <rect y="11" width="24" height="2" rx="1" />
                <rect y="4" width="24" height="2" rx="1" />
                <rect y="18" width="24" height="2" rx="1" />
            </>
        );
    }
}

export default asIcon(IconList);
