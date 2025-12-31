/**
 * In-memory data store for user todo data.
 * This is a lightweight solution for development.
 * In production, replace with a proper database (PostgreSQL, MongoDB, etc.)
 */

import { Todo, Category, Tag, DEFAULT_CATEGORIES, DEFAULT_TAGS } from "@/types";

interface UserData {
    todos: Todo[];
    categories: Category[];
    tags: Tag[];
    migrated: boolean;
}

// In-memory store - will reset on server restart
// In production, use a database
const userDataStore = new Map<string, UserData>();

function getDefaultUserData(): UserData {
    return {
        todos: [],
        categories: [...DEFAULT_CATEGORIES],
        tags: [...DEFAULT_TAGS],
        migrated: false,
    };
}

export function getUserData(userId: string): UserData {
    if (!userDataStore.has(userId)) {
        userDataStore.set(userId, getDefaultUserData());
    }
    return userDataStore.get(userId)!;
}

export function setUserData(userId: string, data: Partial<UserData>): UserData {
    const currentData = getUserData(userId);
    const newData = { ...currentData, ...data };
    userDataStore.set(userId, newData);
    return newData;
}

// Todo operations
export function getUserTodos(userId: string): Todo[] {
    return getUserData(userId).todos;
}

export function addUserTodo(userId: string, todo: Todo): Todo {
    const userData = getUserData(userId);
    userData.todos = [todo, ...userData.todos];
    userDataStore.set(userId, userData);
    return todo;
}

export function updateUserTodo(
    userId: string,
    todoId: string,
    updates: Partial<Todo>
): Todo | null {
    const userData = getUserData(userId);
    const todoIndex = userData.todos.findIndex((t) => t.id === todoId);

    if (todoIndex === -1) return null;

    userData.todos[todoIndex] = {
        ...userData.todos[todoIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    userDataStore.set(userId, userData);
    return userData.todos[todoIndex];
}

export function deleteUserTodo(userId: string, todoId: string): boolean {
    const userData = getUserData(userId);
    const initialLength = userData.todos.length;
    userData.todos = userData.todos.filter((t) => t.id !== todoId);
    userDataStore.set(userId, userData);
    return userData.todos.length < initialLength;
}

export function reorderUserTodos(
    userId: string,
    fromIndex: number,
    toIndex: number
): Todo[] {
    const userData = getUserData(userId);
    const newTodos = [...userData.todos];
    const [removed] = newTodos.splice(fromIndex, 1);
    newTodos.splice(toIndex, 0, removed);
    userData.todos = newTodos;
    userDataStore.set(userId, userData);
    return userData.todos;
}

// Category operations
export function getUserCategories(userId: string): Category[] {
    return getUserData(userId).categories;
}

export function addUserCategory(userId: string, category: Category): Category {
    const userData = getUserData(userId);
    userData.categories = [...userData.categories, category];
    userDataStore.set(userId, userData);
    return category;
}

export function deleteUserCategory(userId: string, categoryId: string): boolean {
    const userData = getUserData(userId);
    const initialLength = userData.categories.length;
    userData.categories = userData.categories.filter((c) => c.id !== categoryId);
    // Also remove category from todos
    userData.todos = userData.todos.map((todo) =>
        todo.categoryId === categoryId ? { ...todo, categoryId: null } : todo
    );
    userDataStore.set(userId, userData);
    return userData.categories.length < initialLength;
}

// Tag operations
export function getUserTags(userId: string): Tag[] {
    return getUserData(userId).tags;
}

export function addUserTag(userId: string, tag: Tag): Tag {
    const userData = getUserData(userId);
    userData.tags = [...userData.tags, tag];
    userDataStore.set(userId, userData);
    return tag;
}

export function deleteUserTag(userId: string, tagId: string): boolean {
    const userData = getUserData(userId);
    const initialLength = userData.tags.length;
    userData.tags = userData.tags.filter((t) => t.id !== tagId);
    // Also remove tag from todos
    userData.todos = userData.todos.map((todo) => ({
        ...todo,
        tags: todo.tags.filter((t) => t !== tagId),
    }));
    userDataStore.set(userId, userData);
    return userData.tags.length < initialLength;
}

// Migration flag
export function hasUserMigrated(userId: string): boolean {
    return getUserData(userId).migrated;
}

export function setUserMigrated(userId: string): void {
    const userData = getUserData(userId);
    userData.migrated = true;
    userDataStore.set(userId, userData);
}

// Bulk import for migration
export function importUserData(
    userId: string,
    data: { todos: Todo[]; categories: Category[]; tags: Tag[] }
): UserData {
    const userData = getUserData(userId);
    userData.todos = data.todos;
    userData.categories = data.categories;
    userData.tags = data.tags;
    userData.migrated = true;
    userDataStore.set(userId, userData);
    return userData;
}
