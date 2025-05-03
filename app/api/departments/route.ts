import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        target: true,
        employees: {
          include: {
            leads: true,
          },
        },
      },
    });

    const formattedDepartments = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      target: dept.target?.amount ?? 0,
      totalLeads: (dept.employees ?? []).reduce(
        (sum, emp) => sum + (emp.leads?.length ?? 0),
        0
      ),
      soldLeads: (dept.employees ?? []).reduce(
        (sum, emp) =>
          sum + (emp.leads?.filter((lead) => lead.status?.toUpperCase() === "SOLD").length ?? 0),
        0
      ),
      employees: dept.employees ?? [],
    }));

    return NextResponse.json(formattedDepartments, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching departments:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
