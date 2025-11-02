"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

const records = [
  {
    id: 1,
    institution: "Universidad Nacional Autónoma",
    degree: "Licenciatura en Ingeniería",
    status: "Completado",
    year: "2023",
  },
  {
    id: 2,
    institution: "Instituto Tecnológico",
    degree: "Diplomado en Blockchain",
    status: "En Progreso",
    year: "2024",
  },
]

export default function RecordsPage() {
  const router = useRouter()

  const handleAddRecord = () => {
    // Por ahora muestra un alert, puedes crear una página de formulario después
    alert("Función de agregar registro próximamente")
  }

  const handleRecordClick = (recordId: number) => {
    router.push(`/records/${recordId}`)
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
                <h1 className="text-3xl font-bold text-foreground">Registros Académicos</h1>
                <p className="text-muted-foreground mt-1">Gestiona tu historial académico certificado</p>
              </div>
              <Button onClick={handleAddRecord}>+ Agregar Registro</Button>
            </div>

            <div className="space-y-4">
              {records.map((record) => (
                <Card
                  key={record.id}
                  className="p-6 hover:border-primary transition-colors cursor-pointer"
                  onClick={() => handleRecordClick(record.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <BookOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{record.institution}</h3>
                      <p className="text-muted-foreground mt-1">{record.degree}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-sm text-muted-foreground">{record.year}</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            record.status === "Completado" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
