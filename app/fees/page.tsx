"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download } from "lucide-react"
import { toast } from "sonner"

const fees = [
  {
    id: 1,
    concept: "Certificación de Documento",
    amount: "0.05 ETH",
    date: "2024-10-28",
    status: "Pagado",
  },
  {
    id: 2,
    concept: "Mantenimiento Anual",
    amount: "0.10 ETH",
    date: "2024-10-01",
    status: "Pagado",
  },
  {
    id: 3,
    concept: "Renovación ENS",
    amount: "0.01 ETH",
    date: "2024-11-01",
    status: "Pendiente",
  },
]

export default function FeesPage() {
  const handleGenerateReport = () => {
    toast.success("Generando reporte...")
    // Implementar generación de reporte
  }

  const handleDownloadReceipt = (feeId: number, concept: string) => {
    toast.success(`Descargando recibo: ${concept}`)
    // Implementar descarga de recibo
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Aranceles</h1>
                <p className="text-muted-foreground mt-1">Historial de pagos y transacciones</p>
              </div>
              <Button onClick={handleGenerateReport}>Generar Reporte</Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="p-6">
                <p className="text-muted-foreground text-sm">Total Pagado</p>
                <p className="text-2xl font-bold text-foreground mt-2">0.15 ETH</p>
              </Card>
              <Card className="p-6">
                <p className="text-muted-foreground text-sm">Pendiente</p>
                <p className="text-2xl font-bold text-foreground mt-2">0.01 ETH</p>
              </Card>
              <Card className="p-6">
                <p className="text-muted-foreground text-sm">Últimas 30 Días</p>
                <p className="text-2xl font-bold text-foreground mt-2">0.06 ETH</p>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Concepto</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Monto</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Fecha</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Estado</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-foreground">{fee.concept}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{fee.amount}</td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">{fee.date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            fee.status === "Pagado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {fee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDownloadReceipt(fee.id, fee.concept)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Descargar recibo"
                        >
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
