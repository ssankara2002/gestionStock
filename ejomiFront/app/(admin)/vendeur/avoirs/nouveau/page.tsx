"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NouvelAvoirPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/vendeur/avoirs")
  }, [router])
  return null
}
