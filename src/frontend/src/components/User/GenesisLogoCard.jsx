import React from "react";
// Props: logoText defaults to "Genesis"
const GenesisLogoCard = ({
  logoText = "Genesis",
  // Compute the current year dynamically in the default prop
  copyright = `© ${new Date().getFullYear()} Genesis. All rights reserved`
}) => (
  <div className="relative flex flex-col justify-between items-center w-full h-full bg-[#6366f1] py-6">
    {/* Top Center Text */}
    <div className="absolute top-10 inset-x-0 text-center">
      <span className="text-white font-semibold text-5xl tracking-widest select-none">
        {logoText}
      </span>
    </div>

    {/* Bottom Center Text */}
    <div className="absolute bottom-4 inset-x-0 text-center">
      <span className="text-white text-sm font-medium select-none">
        {copyright}
      </span>
    </div>
  </div>
);

export default GenesisLogoCard;
