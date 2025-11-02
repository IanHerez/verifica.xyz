"use client"

import { useState, useEffect, useCallback } from "react"
import { useUserWallet } from "./use-user-wallet"
import { useDocuments } from "./use-documents"
import { useRoles } from "./use-roles"

export interface Notification {
  id: string
  type: "document_created" | "document_signed" | "document_revoked"
  title: string
  message: string
  documentId?: string
  documentTitle?: string
  timestamp: number
  read: boolean
}

const STORAGE_KEY = "user_notifications"

/**
 * Hook para gestionar notificaciones del usuario
 */
export function useNotifications() {
  const { walletAddress } = useUserWallet()
  const { documents, loadDocuments } = useDocuments()
  const { role } = useRoles()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Cargar documentos periódicamente para detectar cambios
  useEffect(() => {
    if (walletAddress && role) {
      loadDocuments({ role, memberAddress: walletAddress })
      
      // Refrescar cada 30 segundos
      const interval = setInterval(() => {
        loadDocuments({ role, memberAddress: walletAddress })
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [walletAddress, role, loadDocuments])

  /**
   * Cargar notificaciones desde localStorage
   */
  const loadNotifications = useCallback(() => {
    if (typeof window === "undefined" || !walletAddress) return

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${walletAddress.toLowerCase()}`)
      if (stored) {
        const parsed = JSON.parse(stored) as Notification[]
        setNotifications(parsed)
        setUnreadCount(parsed.filter((n) => !n.read).length)
      }
    } catch (error) {
      console.error("[useNotifications] Error cargando notificaciones:", error)
    }
  }, [walletAddress])

  /**
   * Guardar notificaciones en localStorage
   */
  const saveNotifications = useCallback(
    (notifications: Notification[]) => {
      if (typeof window === "undefined" || !walletAddress) return

      try {
        localStorage.setItem(
          `${STORAGE_KEY}_${walletAddress.toLowerCase()}`,
          JSON.stringify(notifications)
        )
      } catch (error) {
        console.error("[useNotifications] Error guardando notificaciones:", error)
      }
    },
    [walletAddress]
  )

  /**
   * Agregar nueva notificación
   */
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        read: false,
      }

      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, 50) // Máximo 50 notificaciones
        saveNotifications(updated)
        return updated
      })

      setUnreadCount((prev) => prev + 1)
    },
    [saveNotifications]
  )

  /**
   * Marcar notificación como leída
   */
  const markAsRead = useCallback(
    (notificationId: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
        saveNotifications(updated)
        setUnreadCount(updated.filter((n) => !n.read).length)
        return updated
      })
    },
    [saveNotifications]
  )

  /**
   * Marcar todas como leídas
   */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      saveNotifications(updated)
      setUnreadCount(0)
      return updated
    })
  }, [saveNotifications])

  /**
   * Eliminar notificación
   */
  const removeNotification = useCallback(
    (notificationId: string) => {
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== notificationId)
        saveNotifications(updated)
        setUnreadCount(updated.filter((n) => !n.read).length)
        return updated
      })
    },
    [saveNotifications]
  )

  /**
   * Detectar nuevos documentos dirigidos al usuario
   */
  useEffect(() => {
    if (!documents.length || !walletAddress || !role) return

    const lastCheckKey = `last_notification_check_${walletAddress.toLowerCase()}`
    const lastCheck = localStorage.getItem(lastCheckKey)
    const lastCheckTime = lastCheck ? parseInt(lastCheck, 10) : 0

    // Buscar documentos nuevos dirigidos al usuario
    documents.forEach((doc) => {
      if (doc.createdAt <= lastCheckTime) return // Ya fue detectado

      const isRecipient =
        doc.sentTo?.memberAddress?.toLowerCase() === walletAddress.toLowerCase() ||
        (doc.sentTo?.role === role && !doc.sentTo?.memberAddress)

      if (isRecipient && doc.status === "pending") {
        addNotification({
          type: "document_created",
          title: "Nuevo documento para ti",
          message: `${doc.title} de ${doc.institution} requiere tu atención`,
          documentId: doc.id,
          documentTitle: doc.title,
        })
      }
    })

    // Actualizar último check
    localStorage.setItem(lastCheckKey, Date.now().toString())
  }, [documents, walletAddress, role, addNotification])

  /**
   * Detectar documentos firmados (para creadores)
   */
  useEffect(() => {
    if (!documents.length || !walletAddress) return

    documents.forEach((doc) => {
      // Solo notificar al creador
      if (doc.createdBy?.toLowerCase() !== walletAddress.toLowerCase()) return

      // Detectar nuevas firmas
      const lastSignaturesKey = `last_signatures_${doc.id}_${walletAddress.toLowerCase()}`
      const lastSignatures = localStorage.getItem(lastSignaturesKey)
      const lastSignaturesCount = lastSignatures ? parseInt(lastSignatures, 10) : 0

      if (doc.signedBy && doc.signedBy.length > lastSignaturesCount) {
        const newSignatures = doc.signedBy.length - lastSignaturesCount
        addNotification({
          type: "document_signed",
          title: "Documento firmado",
          message: `${newSignatures} persona${newSignatures > 1 ? "s" : ""} firmó tu documento "${doc.title}"`,
          documentId: doc.id,
          documentTitle: doc.title,
        })
        localStorage.setItem(lastSignaturesKey, doc.signedBy.length.toString())
      }
    })
  }, [documents, walletAddress, addNotification])

  /**
   * Cargar notificaciones al cambiar wallet
   */
  useEffect(() => {
    if (walletAddress) {
      loadNotifications()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [walletAddress, loadNotifications])

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh: loadNotifications,
  }
}

