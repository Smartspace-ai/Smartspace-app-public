import React from "react";
import fusion5Logo from "./fusion5-logo.jpg";

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <img
      src={fusion5Logo}
      alt="Fusion5 Logo"
      className={className}
      style={{ height: "41px", borderRadius: "8px" }}
    />
  );
};