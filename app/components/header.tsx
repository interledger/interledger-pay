import { Link } from '@remix-run/react'
import { InterledgerLogo } from './ui/logo'

export const Header = () => {
  return (
    <Link
      to="/"
      aria-label="Interledger Pay home"
      className="flex items-center gap-1 text-2xl cursor-pointer"
    >
      <InterledgerLogo className="h-20 w-20 flex-shrink-0 object-contain" />
    </Link>
  )
}
Header.displayName = 'Header'
