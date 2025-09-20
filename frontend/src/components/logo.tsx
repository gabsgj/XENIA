import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

interface LogoProps {
  className?: string;
  withText?: boolean;
  size?: number; // pixel size for the logo image
}

export function Logo({ className, withText = true, size = 40 }: LogoProps) {
  return (
    <Link href="/" className={clsx("flex items-center gap-2 group", className)} aria-label="XENIA Home">
      <Image
        src="/logo.png"
        alt="XENIA Logo"
        width={size}
        height={size}
        priority
        style={{ width: size, height: size }}
        className="rounded-md select-none"
      />
      {withText && (
        <span className="font-bold text-2xl tracking-tighter group-hover:opacity-90 transition-opacity">XENIA</span>
      )}
    </Link>
  );
}

export default Logo;