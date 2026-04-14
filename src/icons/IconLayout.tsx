import React from "react";

export interface IconSvgChildProperties {
  sideLength?: string;
  color?: string;
}

export function asIcon(Component: React.ComponentType<IconSvgChildProperties>) {
  return function IconWithSvgWrapper(properties: IconSvgChildProperties) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={properties.sideLength || "24"}
        height={properties.sideLength || "24"}
        fill={properties.color || "currentColor"}
        viewBox="0 0 24 24"
      >
        <Component {...properties} />
      </svg>
    );
  };
}
