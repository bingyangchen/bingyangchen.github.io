import React from "react";

import { asIcon } from "./IconLayout";

interface Props {}

interface State {}

class IconCSquareFill extends React.Component<Props, State> {
    public state: State;

    public constructor(props: Props) {
        super(props);
        this.state = {};
    }

    public render(): React.ReactNode {
        return (
            <path d="m19,0H5C2.243,0,0,2.243,0,5v14c0,2.757,2.243,5,5,5h14c2.757,0,5-2.243,5-5V5c0-2.757-2.243-5-5-5Zm-10.995,10.909v2.182c0,2.156,1.731,3.909,3.858,3.909h.545c1.307,0,2.522-.65,3.251-1.738.308-.458.929-.581,1.388-.274.458.308.582.929.274,1.388-1.101,1.644-2.938,2.625-4.913,2.625h-.545c-3.23,0-5.858-2.651-5.858-5.909v-2.182c0-3.258,2.628-5.909,5.858-5.909h.545c1.976,0,3.813.981,4.913,2.625.307.459.184,1.08-.275,1.387-.461.307-1.081.184-1.387-.275-.729-1.088-1.943-1.738-3.251-1.738h-.545c-2.127,0-3.858,1.753-3.858,3.909Z" />
        );
    }
}

export default asIcon(IconCSquareFill);
