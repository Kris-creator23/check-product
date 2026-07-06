type BrandLogoProps = {
  href?: string;
};

export function BrandLogo({ href = "/" }: BrandLogoProps) {
  return (
    <a className="brand" href={href} aria-label="CheckApp">
      <img className="brandLogo" src="/checkapp-logo.png" alt="CheckApp" />
    </a>
  );
}
