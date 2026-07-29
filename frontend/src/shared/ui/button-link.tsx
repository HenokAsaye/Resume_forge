import Link from "next/link"
import type { ComponentProps } from "react"
import { Button } from "@/shared/ui/button"

type ButtonProps = ComponentProps<typeof Button>
type LinkProps = ComponentProps<typeof Link>

export type ButtonLinkProps = Omit<ButtonProps, "render" | "nativeButton"> &
  Pick<LinkProps, "href" | "prefetch" | "replace" | "scroll" | "target" | "rel">

export function ButtonLink({
  href,
  prefetch,
  replace,
  scroll,
  target,
  rel,
  ...props
}: ButtonLinkProps) {
  return (
    <Button
      {...props}
      nativeButton={false}
      render={
        <Link
          href={href}
          prefetch={prefetch}
          replace={replace}
          scroll={scroll}
          target={target}
          rel={rel}
        />
      }
    />
  )
}
