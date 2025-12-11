'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, LogOut, Home, ChefHat, Store, TrendingDown } from 'lucide-react'

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
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-14 h-14 flex-shrink-0">
              <Image 
                src="/logo.png" 
                alt="YieldFood Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-bold text-green-600 hidden sm:inline">YieldFood</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors font-medium"
            >
              <Home className="h-5 w-5" />
              <span>Accueil</span>
            </Link>
            <Link
              href="/stocks"
              className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors font-medium"
            >
              <Package className="h-5 w-5" />
              <span>Mes Stocks</span>
            </Link>
            <Link
              href="/recipes"
              className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors font-medium"
            >
              <ChefHat className="h-5 w-5" />
              <span>Mes Recettes</span>
            </Link>
            <Link
              href="/suppliers"
              className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors font-medium"
            >
              <Store className="h-5 w-5" />
              <span>Mes Fournisseurs</span>
            </Link>
            <Link
              href="/consommations"
              className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors font-medium"
            >
              <TrendingDown className="h-5 w-5" />
              <span>Mes Consommations</span>
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
        <nav className="lg:hidden border-t border-gray-100 mt-3 pt-3 pb-3">
          <div className="flex items-center gap-6 overflow-x-auto">
            <Link
              href="/"
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-green-600 transition-colors min-w-fit"
            >
              <Home className="h-5 w-5" />
              <span className="text-xs font-medium">Accueil</span>
            </Link>
            <Link
              href="/stocks"
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-green-600 transition-colors min-w-fit"
            >
              <Package className="h-5 w-5" />
              <span className="text-xs font-medium">Stocks</span>
            </Link>
            <Link
              href="/recipes"
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-green-600 transition-colors min-w-fit"
            >
              <ChefHat className="h-5 w-5" />
              <span className="text-xs font-medium">Recettes</span>
            </Link>
            <Link
              href="/suppliers"
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-green-600 transition-colors min-w-fit"
            >
              <Store className="h-5 w-5" />
              <span className="text-xs font-medium">Fournisseurs</span>
            </Link>
            <Link
              href="/consommations"
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-green-600 transition-colors min-w-fit"
            >
              <TrendingDown className="h-5 w-5" />
              <span className="text-xs font-medium">Consommations</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
