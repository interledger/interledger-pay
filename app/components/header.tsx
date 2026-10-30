import { Link } from '@remix-run/react'
import { InterledgerPayLogo } from './ui/logo'

export const Header = () => {
  return (
    <Link
      to="/"
      aria-label="Interledger Pay home"
      className="flex w-72 max-w-full items-center cursor-pointer"
    >
      <InterledgerPayLogo className="h-20 w-full" />
    </Link>
  )
}
Header.displayName = 'Header'
