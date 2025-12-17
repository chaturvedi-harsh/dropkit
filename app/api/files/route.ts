import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    console.log("Auth userId:", userId);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryUserId = searchParams.get("userId");
    const parentId = searchParams.get("parentId");

    console.log("Query params - userId:", queryUserId, "parentId:", parentId);

    // Verify the user is requesting their own files
    if (!queryUserId || queryUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch files from database based on parentId
    let userFiles;
    if (parentId) {
      // Fetch files within a specific folder
      console.log("Fetching files in folder:", parentId);
      userFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), eq(files.parentId, parentId)));
    } else {
      // Fetch root-level files (where parentId is null)
      console.log("Fetching root-level files for user:", userId);
      userFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), isNull(files.parentId)));
    }

    console.log("Found files:", userFiles.length);
    return NextResponse.json(userFiles);
  } catch (error) {
    console.error("Error fetching files:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("Error stack:", errorStack);
    return NextResponse.json(
      { error: "Failed to fetch files", details: errorMessage },
      { status: 500 }
    );
  }
}
