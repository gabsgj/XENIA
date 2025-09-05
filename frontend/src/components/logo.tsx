import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

interface LogoProps {
  className?: string;
  withText?: boolean;
}

export function Logo({ className, withText = true }: LogoProps) {
  return (
    <Link href="/" className={clsx("flex items-center gap-2 group", className)} aria-label="XENIA Home">
      <Image
        src="/logo.svg"
        alt="XENIA Logo"
        width={40}
        height={40}
        priority
        className="h-8 w-8 rounded-md select-none"
      />
      {withText && (
        <span className="font-bold text-2xl tracking-tighter group-hover:opacity-90 transition-opacity">XENIA</span>
      )}
    </Link>
  );
}

export default Logo;