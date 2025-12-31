import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
    getUserTodos,
    addUserTodo,
    reorderUserTodos,
} from "@/lib/dataStore";
import { validateNewTodoInput } from "@/lib/validation";
import { generateId } from "@/lib/utils";
import { Todo } from "@/types";

/**
 * GET /api/todos - Get all todos for the authenticated user
 */
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todos = getUserTodos(session.user.id);
    return NextResponse.json(todos);
}

/**
 * POST /api/todos - Create a new todo
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Check if this is a reorder request
        if (body.action === "reorder") {
            const { fromIndex, toIndex } = body;
            if (typeof fromIndex !== "number" || typeof toIndex !== "number") {
                return NextResponse.json(
                    { error: "Invalid reorder parameters" },
                    { status: 400 }
                );
            }

            const todos = reorderUserTodos(session.user.id, fromIndex, toIndex);
            return NextResponse.json(todos);
        }

        // Validate input for new todo
        const validationResult = validateNewTodoInput(body);

        if (!validationResult.valid || !validationResult.data) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.errors },
                { status: 400 }
            );
        }

        const { title, categoryId, tags } = validationResult.data;
        const now = new Date().toISOString();

        const newTodo: Todo = {
            id: generateId(),
            title,
            completed: false,
            categoryId,
            tags,
            createdAt: now,
            updatedAt: now,
        };

        const todo = addUserTodo(session.user.id, newTodo);
        return NextResponse.json(todo, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }
}
