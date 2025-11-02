"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRoles } from "@/hooks/use-roles"
import { useUserWallet } from "@/hooks/use-user-wallet"
import { useENS } from "@/hooks/use-ens"
import { addMember, getAllMembers, removeMember, type MemberData } from "@/lib/members-storage"
import { toast } from "sonner"
import { Plus, Trash2, User, Users, Shield } from "lucide-react"

export default function MembersPage() {
  const router = useRouter()
  const { authenticated, ready } = usePrivy()
  const { walletAddress } = useUserWallet()
  const { role, canManageMembers, displayName } = useRoles()
  const { resolveENS } = useENS()

  const [members, setMembers] = useState<Record<string, MemberData>>({})
  const [newMemberForm, setNewMemberForm] = useState({
    walletAddress: "",
    ensName: "",
    role: "alumno" as "alumno" | "maestro",
  })
  const [isAdding, setIsAdding] = useState(false)

  // Cargar miembros al montar
  useEffect(() => {
    if (authenticated && ready) {
      const allMembers = getAllMembers()
      console.log("[Members] Cargando miembros:", Object.keys(allMembers).length, "miembros encontrados")
      setMembers(allMembers)
    }
  }, [authenticated, ready])

  // Redirigir si no tiene permisos
  useEffect(() => {
    // Esperar a que el rol se determine completamente
    if (!ready || !authenticated || role === "unknown" || !walletAddress) {
      return // Aún cargando
    }

    console.log("[Members] Verificando permisos:", {
      ready,
      authenticated,
      canManageMembers,
      role,
      displayName,
      walletAddress,
    })

    // Permitir acceso si es rector (por rol o por wallet conocida)
    const isKnownRector = walletAddress?.toLowerCase() === "0x5e8ce7675ecf8e892f704a4de8a268987789d0da"
    const canAccess = canManageMembers || (role === "rector") || isKnownRector

    if (!canAccess) {
      console.warn("[Members] Sin permisos, redirigiendo a /documents")
      toast.error("No tienes permisos para gestionar miembros")
      router.push("/documents")
    } else {
      console.log("[Members] ✅ Acceso permitido para gestión de miembros")
    }
  }, [ready, authenticated, canManageMembers, role, displayName, walletAddress, router])

  // Verificar ENS automáticamente cuando se ingresa una wallet
  const handleWalletInputChange = async (address: string) => {
    setNewMemberForm((prev) => ({ ...prev, walletAddress: address }))
    
    if (address && address.length === 42 && address.startsWith("0x")) {
      try {
        // Intentar resolver ENS desde la wallet
        // (en este caso asumimos que el ENS ya está configurado)
        // Por ahora solo validamos el formato
      } catch (error) {
        console.error("Error verificando wallet:", error)
      }
    }
  }

  const handleAddMember = async () => {
    if (!walletAddress) {
      toast.error("Debes tener una wallet conectada")
      return
    }

    if (!newMemberForm.walletAddress) {
      toast.error("Debes ingresar una dirección de wallet")
      return
    }

    // ENS es opcional para pruebas, usar wallet address como fallback
    if (!newMemberForm.ensName) {
      newMemberForm.ensName = `${newMemberForm.walletAddress.slice(0, 6)}...${newMemberForm.walletAddress.slice(-4)}`
      toast.info("ENS no proporcionado, usando dirección como nombre temporal")
    }

    // Validar formato de wallet
    if (!newMemberForm.walletAddress.startsWith("0x") || newMemberForm.walletAddress.length !== 42) {
      toast.error("Dirección de wallet inválida")
      return
    }

    // Validar formato de ENS (hacer opcional para pruebas)
    // Permitir agregar sin .eth si es para pruebas
    if (newMemberForm.ensName && !newMemberForm.ensName.endsWith(".eth")) {
      const useAnyway = confirm(
        "El nombre ENS no termina en .eth. ¿Deseas continuar de todas formas? (Útil para pruebas sin ENS real)"
      )
      if (!useAnyway) {
        return
      }
    }

    setIsAdding(true)

    try {
      // Opcional: Verificar que el ENS existe y resuelve a la wallet
      // Si falla la resolución, permitir agregar de todas formas (para pruebas)
      let ensResolved = false
      try {
        const resolvedAddress = await resolveENS(newMemberForm.ensName)
        if (resolvedAddress && resolvedAddress.toLowerCase() === newMemberForm.walletAddress.toLowerCase()) {
          ensResolved = true
        }
      } catch (ensError) {
        console.warn("[Members] Error resolviendo ENS, continuando de todas formas:", ensError)
        // Continuar aunque falle la resolución de ENS (para permitir pruebas sin ENS real)
      }

      // Si el ENS no resuelve, mostrar advertencia pero permitir continuar
      if (!ensResolved) {
        const confirmContinue = confirm(
          "El ENS no pudo ser verificado o no resuelve a la wallet proporcionada. ¿Deseas continuar de todas formas? (Útil para pruebas)"
        )
        if (!confirmContinue) {
          setIsAdding(false)
          return
        }
      }

      // Agregar miembro
      const member: MemberData = {
        walletAddress: newMemberForm.walletAddress.toLowerCase(),
        ensName: newMemberForm.ensName.toLowerCase(),
        role: newMemberForm.role,
        addedBy: walletAddress.toLowerCase(),
        addedAt: Date.now(),
      }

      const success = addMember(member)
      if (success) {
        toast.success(`Miembro agregado: ${newMemberForm.ensName} (${newMemberForm.role})`)
        setMembers(getAllMembers())
        setNewMemberForm({ walletAddress: "", ensName: "", role: "alumno" })
      } else {
        toast.error("El miembro ya existe")
      }
    } catch (error) {
      console.error("Error agregando miembro:", error)
      toast.error("Error al agregar miembro")
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveMember = (memberWallet: string, memberENS: string) => {
    if (confirm(`¿Estás seguro de eliminar a ${memberENS}?`)) {
      const success = removeMember(memberWallet)
      if (success) {
        toast.success(`Miembro eliminado: ${memberENS}`)
        setMembers(getAllMembers())
      } else {
        toast.error("Error al eliminar miembro")
      }
    }
  }

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Verificar permisos de nuevo (por si el hook aún está cargando)
  const isKnownRector = walletAddress?.toLowerCase() === "0x5e8ce7675ecf8e892f704a4de8a268987789d0da"
  const hasAccess = canManageMembers || role === "rector" || isKnownRector

  if (!hasAccess && ready && authenticated && walletAddress) {
    console.log("[Members] No tiene permisos, redirigiendo...")
    return null // Se redirigirá automáticamente
  }

  if (!ready || !authenticated || !walletAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  console.log("[Members] Renderizando página de gestión de miembros")

  const membersList = Object.values(members)
  const alumnos = membersList.filter((m) => m.role === "alumno")
  const maestros = membersList.filter((m) => m.role === "maestro")

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Gestión de Miembros</h1>
              </div>
              <p className="text-muted-foreground mt-1">
                Como {displayName}, puedes agregar y gestionar miembros del sistema
              </p>
            </div>

            {/* Estadísticas */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Miembros</p>
                    <p className="text-2xl font-bold text-foreground">{membersList.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary/50" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Alumnos</p>
                    <p className="text-2xl font-bold text-foreground">{alumnos.length}</p>
                  </div>
                  <User className="w-8 h-8 text-blue-500/50" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Maestros</p>
                    <p className="text-2xl font-bold text-foreground">{maestros.length}</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-500/50" />
                </div>
              </Card>
            </div>

            {/* Formulario para agregar miembro */}
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Agregar Nuevo Miembro
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="wallet-address">Dirección Wallet</Label>
                  <Input
                    id="wallet-address"
                    value={newMemberForm.walletAddress}
                    onChange={(e) => handleWalletInputChange(e.target.value)}
                    placeholder="0x..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ens-name">Nombre ENS</Label>
                  <Input
                    id="ens-name"
                    value={newMemberForm.ensName}
                    onChange={(e) => setNewMemberForm((prev) => ({ ...prev, ensName: e.target.value }))}
                    placeholder="nombre.maestro.eth o nombre.alumno.eth"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="member-role">Rol</Label>
                  <Select
                    value={newMemberForm.role}
                    onValueChange={(value: "alumno" | "maestro") =>
                      setNewMemberForm((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alumno">Alumno</SelectItem>
                      <SelectItem value="maestro">Maestro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleAddMember} disabled={isAdding} className="w-full md:w-auto">
                  {isAdding ? "Agregando..." : "Agregar Miembro"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ENS opcional: Si no tienes ENS registrado, deja el campo vacío y se usará la dirección como nombre. Para producción, el ENS debe resolver a la wallet.
              </p>
            </Card>

            {/* Lista de miembros */}
            <div className="space-y-6">
              {/* Alumnos */}
              {alumnos.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    Alumnos ({alumnos.length})
                  </h3>
                  <div className="space-y-2">
                    {alumnos.map((member) => (
                      <div
                        key={member.walletAddress}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{member.ensName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{member.walletAddress}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Agregado: {new Date(member.addedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.walletAddress, member.ensName)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Maestros */}
              {maestros.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    Maestros ({maestros.length})
                  </h3>
                  <div className="space-y-2">
                    {maestros.map((member) => (
                      <div
                        key={member.walletAddress}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{member.ensName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{member.walletAddress}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Agregado: {new Date(member.addedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.walletAddress, member.ensName)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {membersList.length === 0 && (
                <Card className="p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay miembros registrados aún</p>
                  <p className="text-sm text-muted-foreground mt-1">Agrega tu primer miembro usando el formulario arriba</p>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

