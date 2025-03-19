import { Link } from '@remix-run/react'
import { InterledgerPayLogo } from './ui/logo'

export const Header = () => {
  return (
    <Link to="/" className="flex items-center gap-1 text-2xl cursor-pointer">
      <InterledgerPayLogo
        className="h-20 w-72 flex-shrink-0 inline-flex"
        aria-label="Logo"
      />
    </Link>
  )
}
Header.displayName = 'Header'
