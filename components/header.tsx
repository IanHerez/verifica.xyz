"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import Image from "next/image"
import { Bell, Search, User, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatAddress } from "@/lib/web3-utils"
import { useUserWallet } from "@/hooks/use-user-wallet"
import { useEmailENS } from "@/hooks/use-email-ens"
import Link from "next/link"

export function Header() {
  const router = useRouter()
  const { authenticated, user, login, logout, getAccessToken } = usePrivy()
  const { walletAddress, loading: walletLoading, refresh } = useUserWallet()
  const { ensName } = useEmailENS() // Prioriza ENS por email
  const [searchQuery, setSearchQuery] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)

  // Pre-cargar access token para reducir latencia en requests
  useEffect(() => {
    if (authenticated) {
      getAccessToken().catch(() => {
        // Silently handle token fetch errors
      })
    }
  }, [authenticated, getAccessToken])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Redirigir a página de búsqueda o filtrar documentos
      router.push(`/documents?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleConnectWallet = () => {
    if (!authenticated) {
      login()
    } else {
      // Refrescar wallet si ya está autenticado
      refresh()
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header className="border-b border-border bg-card sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        {/* Logo */}
        <Link href="/documents" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
          <Image
            src="/verifica logo.png"
            alt="Verifica Logo"
            width={32}
            height={32}
            className="rounded-lg object-contain"
          />
          <span className="font-bold text-lg hidden sm:inline">Verifica</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar documentos..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          </form>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-6">
          {/* Notifications */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Nuevo documento verificado</p>
                  <p className="text-xs text-muted-foreground">Hace 2 horas</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="py-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Tu documento ha sido publicado</p>
                  <p className="text-xs text-muted-foreground">Hace 1 día</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span className="text-sm">Ver todas las notificaciones</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <User className="w-5 h-5 text-muted-foreground" />
          </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  {ensName ? (
                    <>
                      <span className="font-semibold">{ensName}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {walletAddress ? formatAddress(walletAddress) : "Cargando..."}
                      </span>
                    </>
                  ) : (
                    <span>
                      {walletAddress
                        ? formatAddress(walletAddress)
                        : user?.email?.address || user?.wallet?.address || "Usuario"}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/records")}>
                Mis Registros
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/fees")}>
                Aranceles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/ens")}>
                Gestión ENS
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Wallet Button */}
          {authenticated ? (
            walletAddress ? (
              <Button variant="outline" size="sm" onClick={() => router.push("/ens")} title="Ver wallet y ENS">
                <Wallet className="w-4 h-4 mr-2" />
                {ensName || formatAddress(walletAddress)}
              </Button>
            ) : walletLoading ? (
              <Button variant="outline" size="sm" disabled>
                <Wallet className="w-4 h-4 mr-2 animate-pulse" />
                Cargando...
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={refresh}>
                <Wallet className="w-4 h-4 mr-2" />
                Obtener Wallet
              </Button>
            )
          ) : (
            <Button size="sm" onClick={handleConnectWallet}>
              <Wallet className="w-4 h-4 mr-2" />
              Conectar Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
