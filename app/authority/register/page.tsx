"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, CheckCircle2, Lock, Building2, FileText, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type RegistrationStep = "info" | "verification" | "blockchain" | "success"

export default function AuthorityRegisterPage() {
  const [step, setStep] = useState<RegistrationStep>("info")
  const [formData, setFormData] = useState({
    institutionName: "",
    institutionType: "",
    registryNumber: "",
    email: "",
    phone: "",
    address: "",
    contactName: "",
    contactPosition: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStepChange = (newStep: RegistrationStep) => {
    setStep(newStep)
  }

  const renderStep = () => {
    switch (step) {
      case "info":
        return (
          <InstitutionInfoStep
            data={formData}
            onChange={handleInputChange}
            onNext={() => handleStepChange("verification")}
          />
        )
      case "verification":
        return (
          <VerificationStep
            data={formData}
            onChange={handleInputChange}
            onNext={() => handleStepChange("blockchain")}
            onBack={() => handleStepChange("info")}
          />
        )
      case "blockchain":
        return (
          <BlockchainStep
            data={formData}
            onNext={() => handleStepChange("success")}
            onBack={() => handleStepChange("verification")}
          />
        )
      case "success":
        return <SuccessStep institutionName={formData.institutionName} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          {step !== "success" && (
            <Link href="/">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Registro de Autoridad</h1>
            <p className="text-sm text-muted-foreground">Certificación de instituciones emisoras</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto p-6">
        {/* Progress Indicator */}
        {step !== "success" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {["info", "verification", "blockchain"].map((s, idx) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        s === step
                          ? "bg-primary text-primary-foreground"
                          : ["info", "verification", "blockchain"].indexOf(s) <
                              ["info", "verification", "blockchain"].indexOf(step)
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {["info", "verification", "blockchain"].indexOf(s) <
                      ["info", "verification", "blockchain"].indexOf(step) ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < 2 && (
                      <div
                        className={`h-1 w-12 mx-2 ${["info", "verification", "blockchain"].indexOf(s) < ["info", "verification", "blockchain"].indexOf(step) ? "bg-accent" : "bg-muted"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Información</span>
              <span>Verificación</span>
              <span>Blockchain</span>
            </div>
          </div>
        )}

        {/* Step Content */}
        {renderStep()}
      </div>
    </div>
  )
}

function InstitutionInfoStep({
  data,
  onChange,
  onNext,
}: {
  data: any
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  onNext: () => void
}) {
  return (
    <Card className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Información Institucional</h2>
      </div>

      <div className="space-y-6">
        {/* Institution Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Nombre de la Institución</label>
            <input
              type="text"
              name="institutionName"
              value={data.institutionName}
              onChange={onChange}
              placeholder="Ej: Universidad Nacional"
              className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tipo de Institución</label>
              <select
                name="institutionType"
                value={data.institutionType}
                onChange={onChange}
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Seleccionar tipo...</option>
                <option value="university">Universidad</option>
                <option value="school">Colegio/Escuela</option>
                <option value="government">Entidad Gubernamental</option>
                <option value="professional">Colegio Profesional</option>
                <option value="other">Otra</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Número de Registro</label>
              <input
                type="text"
                name="registryNumber"
                value={data.registryNumber}
                onChange={onChange}
                placeholder="Ej: REG-2024-001"
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Dirección</label>
            <textarea
              name="address"
              value={data.address}
              onChange={onChange}
              placeholder="Dirección completa de la institución"
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-4 pt-6 border-t border-border">
          <h3 className="font-semibold text-foreground">Contacto Responsable</h3>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Nombre del Contacto</label>
            <input
              type="text"
              name="contactName"
              value={data.contactName}
              onChange={onChange}
              placeholder="Nombre completo"
              className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Cargo</label>
              <input
                type="text"
                name="contactPosition"
                value={data.contactPosition}
                onChange={onChange}
                placeholder="Ej: Director de Registros"
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={onChange}
                placeholder="contacto@institucion.com"
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Teléfono</label>
            <input
              type="tel"
              name="phone"
              value={data.phone}
              onChange={onChange}
              placeholder="+1 (XXX) XXX-XXXX"
              className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-border">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Cancelar
            </Button>
          </Link>
          <Button onClick={onNext} className="flex-1" disabled={!data.institutionName || !data.email}>
            Siguiente
          </Button>
        </div>
      </div>
    </Card>
  )
}

function VerificationStep({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: any
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <Card className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Verificación Institucional</h2>
      </div>

      <div className="space-y-6">
        {/* Verification Info */}
        <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-sm text-foreground">
            Se verificará tu institución mediante documentos oficiales y registros públicos. Este proceso asegura que
            solo autoridades legítimas publiquen documentos en la plataforma.
          </p>
        </div>

        {/* Upload Documents */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Documentos Requeridos</h3>

          <div className="space-y-3">
            {[
              { label: "Certificado de Constitución", hint: "Documento legal de fundación" },
              { label: "Acta de Registro", hint: "Registro ante autoridades competentes" },
              { label: "Credencial del Responsable", hint: "Identificación oficial del contacto" },
            ].map((doc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{doc.label}</p>
                    <p className="text-sm text-muted-foreground">{doc.hint}</p>
                  </div>
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acceptance */}
        <div className="space-y-4 pt-6 border-t border-border">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1 rounded border-input" required />
            <span className="text-sm text-foreground">
              Certifico que la información proporcionada es veraz y autorizo a Verifica a verificar los datos de mi
              institución.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1 rounded border-input" required />
            <span className="text-sm text-foreground">
              Acepto los términos y condiciones para autoridades publicadoras en Verifica.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-border">
          <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
            Atrás
          </Button>
          <Button onClick={onNext} className="flex-1">
            Continuar
          </Button>
        </div>
      </div>
    </Card>
  )
}

function BlockchainStep({
  data,
  onNext,
  onBack,
}: {
  data: any
  onNext: () => void
  onBack: () => void
}) {
  const [connecting, setConnecting] = useState(false)

  return (
    <Card className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Verificación en Blockchain</h2>
      </div>

      <div className="space-y-6">
        {/* Explanation */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-foreground">
            Conecta tu wallet para registrar la identidad de tu institución en blockchain. Esto crea un registro
            inmutable de tu autoridad como publicadora de documentos verificados.
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Conectar Wallet</h3>
          <Button
            onClick={() => {
              setConnecting(true)
              setTimeout(() => setConnecting(false), 1500)
            }}
            className="w-full"
            disabled={connecting}
          >
            {connecting ? "Conectando..." : "Conectar Wallet"}
          </Button>
        </div>

        {/* Details */}
        <div className="space-y-3 pt-6 border-t border-border">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Registro Seguro</p>
              <p className="text-xs text-muted-foreground">
                Tu identidad será registrada de forma segura en blockchain.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Verificación Interna</p>
              <p className="text-xs text-muted-foreground">Nuestro equipo completará la verificación en 24-48 horas.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-border">
          <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
            Atrás
          </Button>
          <Button onClick={onNext} className="flex-1">
            Completar Registro
          </Button>
        </div>
      </div>
    </Card>
  )
}

function SuccessStep({ institutionName }: { institutionName: string }) {
  return (
    <div className="text-center">
      <Card className="p-12">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-accent" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-2">¡Registro Completado!</h2>
        <p className="text-lg text-muted-foreground mb-8">
          {institutionName || "Tu institución"} ha sido registrada exitosamente en Verifica.
        </p>

        <div className="space-y-4 text-left bg-muted/50 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Verificación en Proceso</p>
              <p className="text-xs text-muted-foreground">Nuestro equipo revisará tus documentos en 24-48 horas.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Acceso Temporal</p>
              <p className="text-xs text-muted-foreground">
                Tendrás acceso limitado mientras se completa la verificación.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Confirmación por Email</p>
              <p className="text-xs text-muted-foreground">Recibirás un email cuando se complete tu verificación.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Ir a Inicio
            </Button>
          </Link>
          <Link href="/documents" className="flex-1">
            <Button className="w-full">Ir al Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
