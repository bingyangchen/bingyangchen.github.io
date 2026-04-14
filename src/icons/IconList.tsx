import { asIcon, type IconSvgChildProperties } from "./IconLayout";

function IconList(_properties: IconSvgChildProperties) {
  return (
    <>
      <rect y="11" width="24" height="2" rx="1" />
      <rect y="4" width="24" height="2" rx="1" />
      <rect y="18" width="24" height="2" rx="1" />
    </>
  );
}

export default asIcon(IconList);
