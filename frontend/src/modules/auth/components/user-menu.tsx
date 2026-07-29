"use client"

import { useRouter } from "next/navigation"
import { LogOut, User as UserIcon } from "lucide-react"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Skeleton } from "@/shared/ui/skeleton"
import { useCurrentUser, useLogout } from "../api/use-auth"

export function UserMenu() {
  const router = useRouter()
  const { data: user, isPending } = useCurrentUser()
  const logout = useLogout()

  if (isPending) {
    return <Skeleton className="size-8 rounded-full" />
  }

  const label = user?.name || user?.email || "Account"
  const initial = label.charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Account menu">
            <span className="bg-secondary text-secondary-foreground flex size-7 items-center justify-center rounded-full text-xs font-medium">
              {initial}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{label}</span>
          {user?.email && user.name && (
            <span className="text-muted-foreground truncate text-xs font-normal">
              {user.email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserIcon />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={logout.isPending}
          onClick={async () => {
            await logout.mutateAsync()
            router.replace("/login")
            router.refresh()
          }}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
