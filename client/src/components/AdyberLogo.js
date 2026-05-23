"use client";

/**
 * Adyber Logo Component
 * Renders the "Adyber." brand mark with the signature lime-green dot.
 * 
 * @author NaitikGrover (naitik@adyber.com)
 * @param {string} size - 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'
 * @param {string} className - additional classes
 */
export default function AdyberLogo({ size = "md", className = "" }) {
  const sizes = {
    xs:   "text-sm",
    sm:   "text-lg",
    md:   "text-xl",
    lg:   "text-3xl",
    xl:   "text-4xl",
    hero: "text-5xl",
  };

  const s = sizes[size] || sizes.md;

  return (
    <span className={`${s} font-inter font-bold tracking-tighter text-white select-none inline-flex items-baseline ${className}`}>
      Adyber
      <span 
        className="inline-block rounded-full bg-[#CCFF00] w-[0.16em] h-[0.16em] ml-[0.06em] shrink-0 align-baseline"
        style={{ transform: "translateY(-0.02em)" }}
      />
    </span>
  );
}
