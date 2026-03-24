import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// GET /api/user/locale - Get user's locale preference
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ locale: "fr" }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { language: true },
    });

    return NextResponse.json(
      { locale: user?.language || "fr" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user locale:", error);
    return NextResponse.json({ locale: "fr" }, { status: 200 });
  }
}

// POST /api/user/locale - Update user's locale preference
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { locale } = body;

    if (!locale || !["fr", "en"].includes(locale)) {
      return NextResponse.json(
        { error: "Invalid locale" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { language: locale },
    });

    return NextResponse.json(
      { success: true, locale },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user locale:", error);
    return NextResponse.json(
      { error: "Failed to update locale" },
      { status: 500 }
    );
  }
}
