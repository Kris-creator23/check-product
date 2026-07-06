type BrandLogoProps = {
  href?: string;
};

export function BrandLogo({ href = "/" }: BrandLogoProps) {
  return (
    <a className="brand" href={href} aria-label="ChecKApp">
      <img className="brandLogo" src="/checkapp-logo.png" alt="ChecKApp" />
    </a>
  );
}
