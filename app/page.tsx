"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePrivy } from "@privy-io/react-auth"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Shield, Zap, Lock, Wallet, FileCheck } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"

export default function Home() {
  const router = useRouter()
  const { login, authenticated, user, ready } = usePrivy()
  const { role, loading: roleLoading } = useRoles()
  const [hasRedirected, setHasRedirected] = useState(false)

  // NO mostrar mensaje aquí - se mostrará en las páginas destino después de la redirección

  // Redirigir según el rol cuando el usuario esté autenticado
  useEffect(() => {
    // Evitar múltiples redirecciones
    if (hasRedirected) return

    // Si Privy está listo y el usuario está autenticado
    if (ready && authenticated) {
      // Si el rol ya se determinó (incluso si es "unknown")
      if (!roleLoading) {
        setHasRedirected(true)
        if (role === "alumno") {
          router.replace("/alumno")
        } else if (role === "maestro" || role === "rector") {
          router.replace("/documents")
        } else {
          // Si el rol es "unknown", redirigir a documents por defecto
          console.log("[Home] Rol unknown, redirigiendo a /documents por defecto")
          router.replace("/documents")
        }
      } else {
        // Si lleva más de 5 segundos cargando el rol, redirigir de todas formas
        const timeout = setTimeout(() => {
          console.warn("[Home] Timeout cargando rol, redirigiendo a /documents")
          setHasRedirected(true)
          router.replace("/documents")
        }, 5000)

        return () => clearTimeout(timeout)
      }
    }
  }, [ready, authenticated, role, roleLoading, hasRedirected, router])

  // Mostrar loading mientras Privy se inicializa
  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si está autenticado, mostrar loading mientras se determina el rol y redirige
  if (authenticated && !hasRedirected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {roleLoading ? "Verificando rol..." : "Redirigiendo..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
            <Image
              src="/verifica logo.png"
              alt="Verifica Logo"
              width={32}
              height={32}
              className="rounded-lg object-contain"
            />
            <span>Verifica</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:text-primary transition-colors">
              Características
            </a>
            <a href="#about" className="text-sm hover:text-primary transition-colors">
              Sobre Nosotros
            </a>
            <a href="#contact" className="text-sm hover:text-primary transition-colors">
              Contacto
            </a>
          </div>
          <Button onClick={() => login()} className="rounded-full">
            Conectar Wallet
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                <span className="text-sm font-medium text-primary">Transparencia Institucional</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight text-balance">
                Documentos verificables con <span className="text-primary">blockchain</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                La plataforma definitiva para instituciones que requieren transparencia, seguridad y confianza en sus
                documentos oficiales.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={() => login()} size="lg" className="rounded-full font-semibold">
                  Comenzar Ahora
                </Button>
                <Button variant="outline" size="lg" className="rounded-full font-semibold bg-transparent" asChild>
                  <a href="#features">Ver Más</a>
                </Button>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-full aspect-square max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-3xl"></div>
                <div className="relative bg-card border border-border rounded-2xl p-8 backdrop-blur">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Seguridad</p>
                        <p className="text-xs text-muted-foreground">Protegido con blockchain</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Verificación</p>
                        <p className="text-xs text-muted-foreground">Validación instantánea</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Rapidez</p>
                        <p className="text-xs text-muted-foreground">Procesamiento inmediato</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              Todo lo que necesitas para gestionar documentos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Una solución completa diseñada para instituciones que valoran la seguridad y la transparencia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Protección con Blockchain",
                description:
                  "Cada documento es registrado en blockchain, garantizando inmutabilidad y seguridad total.",
              },
              {
                icon: Lock,
                title: "Autenticación Segura",
                description: "Autenticación descentralizada mediante Privy y Web3, verificación de autoridades.",
              },
              {
                icon: FileCheck,
                title: "Verificación Pública",
                description:
                  "Cualquiera puede verificar la autenticidad de un documento usando su identificador único.",
              },
              {
                icon: Wallet,
                title: "Gestión con Wallet",
                description: "Conecta tu wallet para una experiencia completamente descentralizada y segura.",
              },
              {
                icon: Zap,
                title: "Rapidez de Procesamiento",
                description: "Publicación y verificación instantánea de documentos sin demoras administrativas.",
              },
              {
                icon: Check,
                title: "Trazabilidad Completa",
                description: "Registro detallado de cada acción realizada sobre tus documentos para auditoría.",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className="p-6 rounded-xl border border-border bg-background hover:border-primary transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Transforma tu proceso de documentación</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Únete a instituciones que ya confían en Verifica para mantener la integridad y seguridad de sus documentos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => login()} size="lg" className="rounded-full font-semibold">
              Comenzar Ahora
            </Button>
            <Button variant="outline" size="lg" className="rounded-full font-semibold bg-transparent">
              Contactar Ventas
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-bold mb-4">
                <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-primary-foreground" />
                </div>
                <span>Verifica</span>
              </div>
              <p className="text-sm text-muted-foreground">Transparencia institucional con blockchain</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Seguridad
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Acerca de
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Términos
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>&copy; 2025 Verifica. Todos los derechos reservados.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                LinkedIn
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
