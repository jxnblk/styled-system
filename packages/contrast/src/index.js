import { system, get } from "@styled-system/core";

const getContrastColor = (n, scale) => {
  let bgColor = get(scale, n, n);

  if (bgColor.length === 4) {
    bgColor = `#${bgColor.substr(1)}${bgColor.substr(1)}`;
  }

  const getContrastYIQ = hexcolor => {
    const hex = hexcolor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 150 ? "black" : "white";
  };

  return get(scale, getContrastYIQ(bgColor), getContrastYIQ(bgColor));
};

const config = {
  backgroundColor: {
    property: "color",
    scale: "colors",
    transform: getContrastColor,
  },
};
config.bg = config.backgroundColor;

export const contrast = system(config);
export default contrast;
