import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserCategories, addUserCategory } from "@/lib/dataStore";
import { validateNewCategoryInput } from "@/lib/validation";
import { generateId } from "@/lib/utils";
import { Category } from "@/types";

/**
 * GET /api/categories - Get all categories for the authenticated user
 */
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = getUserCategories(session.user.id);
    return NextResponse.json(categories);
}

/**
 * POST /api/categories - Create a new category
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Validate input
        const validationResult = validateNewCategoryInput(body);

        if (!validationResult.valid || !validationResult.data) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.errors },
                { status: 400 }
            );
        }

        const { name, icon, color } = validationResult.data;

        const newCategory: Category = {
            id: generateId(),
            name,
            icon,
            color,
        };

        const category = addUserCategory(session.user.id, newCategory);
        return NextResponse.json(category, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }
}
