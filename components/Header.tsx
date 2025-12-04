'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, LogOut, Home, ChefHat, Store } from 'lucide-react'

export default function Header() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold text-green-600">YieldFood</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              Accueil
            </Link>
            <Link
              href="/stocks"
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Package className="h-4 w-4" />
              Mes Stocks
            </Link>
            <Link
              href="/recipes"
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ChefHat className="h-4 w-4" />
              Mes Recettes
            </Link>
            <Link
              href="/suppliers"
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Store className="h-4 w-4" />
              Mes Fournisseurs
            </Link>
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <nav className="md:hidden flex items-center gap-4 pb-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            <Home className="h-4 w-4" />
            Accueil
          </Link>
          <Link
            href="/stocks"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            <Package className="h-4 w-4" />
            Mes Stocks
          </Link>
          <Link
            href="/recipes"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            <ChefHat className="h-4 w-4" />
            Recettes
          </Link>
          <Link
            href="/suppliers"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            <Store className="h-4 w-4" />
            Fournisseurs
          </Link>
        </nav>
      </div>
    </header>
  )
}
