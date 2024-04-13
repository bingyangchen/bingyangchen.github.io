import React from "react";

import { asIcon } from "./IconLayout";

interface Props {}

interface State {}

class IconFilePerson extends React.Component<Props, State> {
    public state: State;

    public constructor(props: Props) {
        super(props);
        this.state = {};
    }

    public render(): React.ReactNode {
        return (
            <path d="m16,24h-8c-2.757,0-5-2.243-5-5V7c0-2.757,2.243-5,5-5h.171C8.584.836,9.696,0,11,0h2C14.304,0,15.416.836,15.829,2h.171c2.757,0,5,2.243,5,5v12c0,2.757-2.243,5-5,5ZM8,4c-1.654,0-3,1.346-3,3v12c0,1.654,1.346,3,3,3h8c1.654,0,3-1.346,3-3V7c0-1.654-1.346-3-3-3h-1c-.552,0-1-.448-1-1s-.449-1-1-1h-2c-.551,0-1,.449-1,1s-.448,1-1,1h-1Zm4,9c1.381,0,2.5-1.119,2.5-2.5s-1.119-2.5-2.5-2.5-2.5,1.119-2.5,2.5,1.119,2.5,2.5,2.5Zm4.249,5.968c.535-.137.857-.683.719-1.217-.559-2.173-2.648-3.751-4.968-3.751s-4.409,1.578-4.968,3.751c-.138.535.184,1.08.719,1.217.537.138,1.08-.184,1.217-.719.33-1.282,1.633-2.249,3.032-2.249s2.702.967,3.032,2.249c.116.452.522.751.968.751.082,0,.166-.01.25-.032Z" />
        );
    }
}
export default asIcon(IconFilePerson);
