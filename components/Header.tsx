'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, LogOut, Home, ChefHat, Store, TrendingDown, History, ShoppingCart } from 'lucide-react'

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
        <div className="flex justify-between items-center h-20 gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
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
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/stocks"
              className="flex items-center gap-1.5 text-gray-700 hover:text-green-600 transition-colors text-sm"
            >
              <Package className="h-4 w-4" />
              <span>Mes Stocks</span>
            </Link>
            <Link
              href="/recipes"
              className="flex items-center gap-1.5 text-gray-700 hover:text-green-600 transition-colors text-sm"
            >
              <ChefHat className="h-4 w-4" />
              <span>Mes Recettes</span>
            </Link>
            <Link
              href="/suppliers"
              className="flex items-center gap-1.5 text-gray-700 hover:text-green-600 transition-colors text-sm"
            >
              <Store className="h-4 w-4" />
              <span>Mes Fournisseurs</span>
            </Link>
            <Link
              href="/consommations"
              className="flex items-center gap-1.5 text-gray-700 hover:text-green-600 transition-colors text-sm"
            >
              <TrendingDown className="h-4 w-4" />
              <span>Mes Consommations</span>
            </Link>
            <Link
              href="/historique-commandes"
              className="flex items-center gap-1.5 text-gray-700 hover:text-green-600 transition-colors text-sm"
            >
              <History className="h-4 w-4" />
              <span>Historique</span>
            </Link>
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 text-red-600" />
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <nav className="lg:hidden border-t border-gray-100 mt-3 pt-3 pb-3">
          <div className="flex items-center gap-6 overflow-x-auto">
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
            <Link
              href="/historique-commandes"
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-green-600 transition-colors min-w-fit"
            >
              <History className="h-5 w-5" />
              <span className="text-xs font-medium">Historique</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
