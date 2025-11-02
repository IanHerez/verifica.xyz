"use client"

import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  FileText,
  PlusCircle,
  BookOpen,
  Network,
  CreditCard,
  Settings,
  LogOut,
  Users,
  FileCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRoles } from "@/hooks/use-roles"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

// Items de navegación por rol
const alumnoNavItems: NavItem[] = [
  { href: "/alumno", label: "Mis Documentos", icon: FileText },
  { href: "/documents/signed", label: "Documentos Firmados", icon: FileCheck },
]

const maestroNavItems: NavItem[] = [
  { href: "/documents", label: "Mis Documentos", icon: FileText },
  { href: "/create", label: "Crear Documento", icon: PlusCircle },
  { href: "/documents/signed", label: "Documentos Firmados", icon: FileCheck },
]

const rectorNavItems: NavItem[] = [
  { href: "/documents", label: "Mis Documentos", icon: FileText },
  { href: "/create", label: "Crear Documento", icon: PlusCircle },
  { href: "/records", label: "Registros Académicos", icon: BookOpen },
  { href: "/ens", label: "Gestión ENS", icon: Network },
  { href: "/members", label: "Gestión de Miembros", icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = usePrivy()
  const { role, loading: roleLoading } = useRoles()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleSettings = () => {
    // Por ahora redirige a una página de configuración (puedes crear una después)
    alert("Página de configuración próximamente")
  }

  // Determinar items de navegación según el rol
  const getNavItems = (): NavItem[] => {
    if (roleLoading || role === "unknown") {
      return [] // No mostrar items mientras se carga el rol
    }

    switch (role) {
      case "alumno":
        return alumnoNavItems
      case "maestro":
        return maestroNavItems
      case "rector":
        return rectorNavItems
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <aside className="w-64 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link
          href={role === "alumno" ? "/alumno" : "/documents"}
          className="flex items-center gap-3"
        >
          <Image
            src="/verifica logo.png"
            alt="Verifica Logo"
            width={32}
            height={32}
            className="rounded-lg object-contain"
          />
          <span className="font-semibold text-lg">Verifica</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <button
          onClick={handleSettings}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Configuración</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
