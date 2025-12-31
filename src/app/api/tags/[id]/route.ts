import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deleteUserTag } from "@/lib/dataStore";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * DELETE /api/tags/[id] - Delete a tag
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = deleteUserTag(session.user.id, id);

    if (!deleted) {
        return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
