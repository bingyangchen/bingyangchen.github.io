import React from "react";

export interface IconSvgChildProperties {
  sideLength?: string;
  color?: string;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
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
        className={properties.className}
        aria-hidden={properties["aria-hidden"]}
      >
        <Component {...properties} />
      </svg>
    );
  };
}
