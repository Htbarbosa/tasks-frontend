import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
    getUserData,
    importUserData,
    hasUserMigrated,
} from "@/lib/dataStore";
import { validateTodoState } from "@/lib/validation";

/**
 * GET /api/data - Get all user data (todos, categories, tags)
 */
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userData = getUserData(userId);

    return NextResponse.json({
        todos: userData.todos,
        categories: userData.categories,
        tags: userData.tags,
        migrated: userData.migrated,
    });
}

/**
 * POST /api/data/migrate - Migrate localStorage data to server
 * This endpoint validates all incoming data before storing
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if already migrated
    if (hasUserMigrated(userId)) {
        return NextResponse.json(
            { error: "Data already migrated", migrated: true },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();

        // Validate and sanitize all data
        const validationResult = validateTodoState(body);

        if (!validationResult.data) {
            return NextResponse.json(
                { error: "Invalid data format", details: validationResult.errors },
                { status: 400 }
            );
        }

        // Import the validated data
        const userData = importUserData(userId, validationResult.data);

        // Return result with any validation warnings
        return NextResponse.json({
            success: true,
            migrated: true,
            stats: {
                todos: userData.todos.length,
                categories: userData.categories.length,
                tags: userData.tags.length,
            },
            warnings: validationResult.errors.length > 0 ? validationResult.errors : undefined,
        });
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON data" },
            { status: 400 }
        );
    }
}
