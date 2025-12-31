import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserTags, addUserTag } from "@/lib/dataStore";
import { validateNewTagInput } from "@/lib/validation";
import { generateId } from "@/lib/utils";
import { Tag } from "@/types";

/**
 * GET /api/tags - Get all tags for the authenticated user
 */
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = getUserTags(session.user.id);
    return NextResponse.json(tags);
}

/**
 * POST /api/tags - Create a new tag
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Validate input
        const validationResult = validateNewTagInput(body);

        if (!validationResult.valid || !validationResult.data) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.errors },
                { status: 400 }
            );
        }

        const { name, color } = validationResult.data;

        const newTag: Tag = {
            id: generateId(),
            name,
            color,
        };

        const tag = addUserTag(session.user.id, newTag);
        return NextResponse.json(tag, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }
}
