import { LeadStatus, PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
})

export async function POST(request: NextRequest) {
  try {
    const leads = await request.json().catch(() => null)

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ message: "Invalid or empty data" }, { status: 400 })
    }

    const formattedLeads = leads.map((lead) => {
      if (!lead || typeof lead !== "object") {
        throw new Error("Invalid lead data received")
      }

      const {
        name,
        email,
        company,
        phone,
        city,
        designaction,
        message,
        status,
        callBackTime,
        employeeId,
        soldAmount,
      } = lead

      // ---- FIXED STATUS HANDLING ----
      let cleanedStatus: LeadStatus = LeadStatus.COLD

      if (typeof status === "string") {
        const trimmedUpperStatus = status.trim().toUpperCase()

        if (Object.values(LeadStatus).includes(trimmedUpperStatus as LeadStatus)) {
          cleanedStatus = trimmedUpperStatus as LeadStatus
        } else {
          console.warn(`Invalid status "${status}" found, defaulting to COLD`)
        }
      }
      // ---- END FIX ----

      let numericSoldAmount: number | null = null
      if (soldAmount !== undefined && soldAmount !== null) {
        const numericAmount = Number(soldAmount)
        if (!isNaN(numericAmount)) {
          numericSoldAmount = numericAmount
        }
      }

      const formattedLead = {
        name: name ?? "",
        email: email ?? "",
        company: company ?? "",
        phone: phone ? String(phone) : "", // ← FIXED here (empty string if null)
        city: city ?? "",
        designaction: designaction ?? "",
        message: message ?? "",
        status: cleanedStatus,
        callBackTime: callBackTime ? new Date(callBackTime) : null,
        employeeId: employeeId ?? null,
        soldAmount: numericSoldAmount ?? null,
      }

      return formattedLead
    })

    console.log("Formatted leads for import:", formattedLeads)

    const result = await prisma.lead.createMany({
      data: formattedLeads,
    })

    return NextResponse.json(
      {
        message: "Leads imported successfully",
        count: result.count,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error importing leads:", (error as Error).message)
    return NextResponse.json({ message: "Error importing leads", error: (error as Error).message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
