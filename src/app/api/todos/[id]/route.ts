import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateUserTodo, deleteUserTodo, getUserTodos } from "@/lib/dataStore";
import { validateUpdateTodoInput } from "@/lib/validation";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/todos/[id] - Get a specific todo
 */
export async function GET(request: Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const todos = getUserTodos(session.user.id);
    const todo = todos.find((t) => t.id === id);

    if (!todo) {
        return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json(todo);
}

/**
 * PUT /api/todos/[id] - Update a todo
 */
export async function PUT(request: Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        // Validate update input
        const validationResult = validateUpdateTodoInput(body);

        if (!validationResult.valid || !validationResult.data) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.errors },
                { status: 400 }
            );
        }

        const updatedTodo = updateUserTodo(
            session.user.id,
            id,
            validationResult.data
        );

        if (!updatedTodo) {
            return NextResponse.json({ error: "Todo not found" }, { status: 404 });
        }

        return NextResponse.json(updatedTodo);
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }
}

/**
 * DELETE /api/todos/[id] - Delete a todo
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = deleteUserTodo(session.user.id, id);

    if (!deleted) {
        return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
