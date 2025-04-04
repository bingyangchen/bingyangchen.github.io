import React from "react";

import { asIcon } from "./IconLayout";

interface Props {}

interface State {}

class IconChevronDoubleDown extends React.Component<Props, State> {
    public state: State;

    public constructor(props: Props) {
        super(props);
        this.state = {};
    }

    public render(): React.ReactNode {
        return (
            <g id="_01_align_center" data-name=" 01 align center">
                <path d="M11.3,20.878,1.414,10.994,0,12.408l9.885,9.885a3,3,0,0,0,4.242,0L24.019,12.4l-1.413-1.413-9.893,9.892A1,1,0,0,1,11.3,20.878Z" />
                <path d="M12.006,11.586,1.422,1,.006,2.416,11.3,13.707a1,1,0,0,0,1.414,0l11.29-11.29L22.589,1Z" />
            </g>
        );
    }
}

export default asIcon(IconChevronDoubleDown);
