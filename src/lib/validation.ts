/**
 * Data validation utilities for secure migration and API inputs.
 * Validates and sanitizes user-provided data to prevent security issues.
 */

import { Todo, Category, Tag, TodoState } from "@/types";

// Maximum lengths for string fields
const MAX_TITLE_LENGTH = 500;
const MAX_NAME_LENGTH = 100;
const MAX_ICON_LENGTH = 50;
const MAX_ID_LENGTH = 100;
const MAX_TODOS = 10000;
const MAX_CATEGORIES = 100;
const MAX_TAGS = 100;
const MAX_TAGS_PER_TODO = 20;

// Regex patterns for validation
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

interface ValidationResult<T> {
    valid: boolean;
    data?: T;
    errors: string[];
}

/**
 * Sanitize a string to prevent XSS and injection attacks
 */
function sanitizeString(input: unknown, maxLength: number): string | null {
    if (typeof input !== "string") return null;
    // Trim and limit length
    const sanitized = input.trim().slice(0, maxLength);
    // Basic XSS prevention - remove script tags and event handlers
    return sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+\s*=/gi, "");
}

/**
 * Validate and sanitize an ID string
 */
function validateId(id: unknown): string | null {
    if (typeof id !== "string") return null;
    const sanitized = id.trim().slice(0, MAX_ID_LENGTH);
    // Allow UUIDs, timestamps, and simple alphanumeric IDs
    if (!SAFE_ID_REGEX.test(sanitized) && !isValidUUID(sanitized)) {
        return null;
    }
    return sanitized;
}

/**
 * Check if string is a valid UUID
 */
function isValidUUID(str: string): boolean {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * Validate a hex color string
 */
function validateColor(color: unknown): string | null {
    if (typeof color !== "string") return null;
    const trimmed = color.trim();
    if (!HEX_COLOR_REGEX.test(trimmed)) return null;
    return trimmed;
}

/**
 * Validate an ISO date string
 */
function validateISODate(date: unknown): string | null {
    if (typeof date !== "string") return null;
    const trimmed = date.trim();
    if (!ISO_DATE_REGEX.test(trimmed)) {
        // Try to parse as valid date
        const parsed = new Date(trimmed);
        if (isNaN(parsed.getTime())) return null;
        return parsed.toISOString();
    }
    return trimmed;
}

/**
 * Validate and sanitize a single Todo
 */
export function validateTodo(todo: unknown): ValidationResult<Todo> {
    const errors: string[] = [];

    if (!todo || typeof todo !== "object") {
        return { valid: false, errors: ["Todo must be an object"] };
    }

    const t = todo as Record<string, unknown>;

    // Validate required fields
    const id = validateId(t.id);
    if (!id) {
        errors.push("Invalid or missing todo ID");
    }

    const title = sanitizeString(t.title, MAX_TITLE_LENGTH);
    if (!title || title.length === 0) {
        errors.push("Invalid or missing todo title");
    }

    // Validate optional fields with defaults
    const completed = typeof t.completed === "boolean" ? t.completed : false;

    let categoryId: string | null = null;
    if (t.categoryId !== null && t.categoryId !== undefined) {
        categoryId = validateId(t.categoryId);
        if (categoryId === null && t.categoryId !== null) {
            errors.push("Invalid category ID format");
        }
    }

    // Validate tags array
    let tags: string[] = [];
    if (Array.isArray(t.tags)) {
        const validTags = t.tags
            .slice(0, MAX_TAGS_PER_TODO)
            .map((tag) => validateId(tag))
            .filter((tag): tag is string => tag !== null);
        tags = validTags;
    }

    // Validate dates
    const now = new Date().toISOString();
    const createdAt = validateISODate(t.createdAt) || now;
    const updatedAt = validateISODate(t.updatedAt) || now;

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        data: {
            id: id!,
            title: title!,
            completed,
            categoryId,
            tags,
            createdAt,
            updatedAt,
        },
        errors: [],
    };
}

/**
 * Validate and sanitize a single Category
 */
export function validateCategory(category: unknown): ValidationResult<Category> {
    const errors: string[] = [];

    if (!category || typeof category !== "object") {
        return { valid: false, errors: ["Category must be an object"] };
    }

    const c = category as Record<string, unknown>;

    const id = validateId(c.id);
    if (!id) {
        errors.push("Invalid or missing category ID");
    }

    const name = sanitizeString(c.name, MAX_NAME_LENGTH);
    if (!name || name.length === 0) {
        errors.push("Invalid or missing category name");
    }

    const icon = sanitizeString(c.icon, MAX_ICON_LENGTH);
    if (!icon || icon.length === 0) {
        errors.push("Invalid or missing category icon");
    }

    const color = validateColor(c.color);
    if (!color) {
        errors.push("Invalid or missing category color (must be hex format #RRGGBB)");
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        data: {
            id: id!,
            name: name!,
            icon: icon!,
            color: color!,
        },
        errors: [],
    };
}

/**
 * Validate and sanitize a single Tag
 */
export function validateTag(tag: unknown): ValidationResult<Tag> {
    const errors: string[] = [];

    if (!tag || typeof tag !== "object") {
        return { valid: false, errors: ["Tag must be an object"] };
    }

    const t = tag as Record<string, unknown>;

    const id = validateId(t.id);
    if (!id) {
        errors.push("Invalid or missing tag ID");
    }

    const name = sanitizeString(t.name, MAX_NAME_LENGTH);
    if (!name || name.length === 0) {
        errors.push("Invalid or missing tag name");
    }

    const color = validateColor(t.color);
    if (!color) {
        errors.push("Invalid or missing tag color (must be hex format #RRGGBB)");
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        data: {
            id: id!,
            name: name!,
            color: color!,
        },
        errors: [],
    };
}

/**
 * Validate and sanitize entire TodoState for migration
 */
export function validateTodoState(state: unknown): ValidationResult<TodoState> {
    const errors: string[] = [];

    if (!state || typeof state !== "object") {
        return { valid: false, errors: ["State must be an object"] };
    }

    const s = state as Record<string, unknown>;

    // Validate todos array
    const validTodos: Todo[] = [];
    if (Array.isArray(s.todos)) {
        const todosToValidate = s.todos.slice(0, MAX_TODOS);
        for (let i = 0; i < todosToValidate.length; i++) {
            const result = validateTodo(todosToValidate[i]);
            if (result.valid && result.data) {
                validTodos.push(result.data);
            } else {
                errors.push(`Todo at index ${i}: ${result.errors.join(", ")}`);
            }
        }
    }

    // Validate categories array
    const validCategories: Category[] = [];
    if (Array.isArray(s.categories)) {
        const categoriesToValidate = s.categories.slice(0, MAX_CATEGORIES);
        for (let i = 0; i < categoriesToValidate.length; i++) {
            const result = validateCategory(categoriesToValidate[i]);
            if (result.valid && result.data) {
                validCategories.push(result.data);
            } else {
                errors.push(`Category at index ${i}: ${result.errors.join(", ")}`);
            }
        }
    }

    // Validate tags array
    const validTags: Tag[] = [];
    if (Array.isArray(s.tags)) {
        const tagsToValidate = s.tags.slice(0, MAX_TAGS);
        for (let i = 0; i < tagsToValidate.length; i++) {
            const result = validateTag(tagsToValidate[i]);
            if (result.valid && result.data) {
                validTags.push(result.data);
            } else {
                errors.push(`Tag at index ${i}: ${result.errors.join(", ")}`);
            }
        }
    }

    // Cross-validate: ensure todo categoryIds and tags reference valid items
    const categoryIds = new Set(validCategories.map((c) => c.id));
    const tagIds = new Set(validTags.map((t) => t.id));

    const crossValidatedTodos = validTodos.map((todo) => ({
        ...todo,
        categoryId: todo.categoryId && categoryIds.has(todo.categoryId)
            ? todo.categoryId
            : null,
        tags: todo.tags.filter((tagId) => tagIds.has(tagId)),
    }));

    return {
        valid: true, // Return valid with sanitized data, errors are warnings
        data: {
            todos: crossValidatedTodos,
            categories: validCategories,
            tags: validTags,
        },
        errors,
    };
}

/**
 * Validate input for creating a new todo
 */
export function validateNewTodoInput(input: unknown): ValidationResult<{
    title: string;
    categoryId: string | null;
    tags: string[];
}> {
    const errors: string[] = [];

    if (!input || typeof input !== "object") {
        return { valid: false, errors: ["Input must be an object"] };
    }

    const i = input as Record<string, unknown>;

    const title = sanitizeString(i.title, MAX_TITLE_LENGTH);
    if (!title || title.length === 0) {
        errors.push("Title is required and must be a non-empty string");
    }

    let categoryId: string | null = null;
    if (i.categoryId !== null && i.categoryId !== undefined) {
        categoryId = validateId(i.categoryId);
    }

    let tags: string[] = [];
    if (Array.isArray(i.tags)) {
        tags = i.tags
            .slice(0, MAX_TAGS_PER_TODO)
            .map((tag) => validateId(tag))
            .filter((tag): tag is string => tag !== null);
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        data: {
            title: title!,
            categoryId,
            tags,
        },
        errors: [],
    };
}

/**
 * Validate input for updating a todo
 */
export function validateUpdateTodoInput(input: unknown): ValidationResult<Partial<Todo>> {
    const errors: string[] = [];

    if (!input || typeof input !== "object") {
        return { valid: false, errors: ["Input must be an object"] };
    }

    const i = input as Record<string, unknown>;
    const updates: Partial<Todo> = {};

    if ("title" in i) {
        const title = sanitizeString(i.title, MAX_TITLE_LENGTH);
        if (!title || title.length === 0) {
            errors.push("Title must be a non-empty string");
        } else {
            updates.title = title;
        }
    }

    if ("completed" in i) {
        if (typeof i.completed !== "boolean") {
            errors.push("Completed must be a boolean");
        } else {
            updates.completed = i.completed;
        }
    }

    if ("categoryId" in i) {
        if (i.categoryId === null) {
            updates.categoryId = null;
        } else {
            const categoryId = validateId(i.categoryId);
            if (categoryId === null) {
                errors.push("Invalid category ID format");
            } else {
                updates.categoryId = categoryId;
            }
        }
    }

    if ("tags" in i) {
        if (!Array.isArray(i.tags)) {
            errors.push("Tags must be an array");
        } else {
            updates.tags = i.tags
                .slice(0, MAX_TAGS_PER_TODO)
                .map((tag) => validateId(tag))
                .filter((tag): tag is string => tag !== null);
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        data: updates,
        errors: [],
    };
}

/**
 * Validate input for creating a new category
 */
export function validateNewCategoryInput(input: unknown): ValidationResult<{
    name: string;
    icon: string;
    color: string;
}> {
    const errors: string[] = [];

    if (!input || typeof input !== "object") {
        return { valid: false, errors: ["Input must be an object"] };
    }

    const i = input as Record<string, unknown>;

    const name = sanitizeString(i.name, MAX_NAME_LENGTH);
    if (!name || name.length === 0) {
        errors.push("Name is required and must be a non-empty string");
    }

    const icon = sanitizeString(i.icon, MAX_ICON_LENGTH);
    if (!icon || icon.length === 0) {
        errors.push("Icon is required and must be a non-empty string");
    }

    const color = validateColor(i.color);
    if (!color) {
        errors.push("Color is required and must be in hex format (#RRGGBB)");
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        data: {
            name: name!,
            icon: icon!,
            color: color!,
        },
        errors: [],
    };
}

/**
 * Validate input for creating a new tag
 */
export function validateNewTagInput(input: unknown): ValidationResult<{
    name: string;
    color: string;
}> {
    const errors: string[] = [];

    if (!input || typeof input !== "object") {
        return { valid: false, errors: ["Input must be an object"] };
    }

    const i = input as Record<string, unknown>;

    const name = sanitizeString(i.name, MAX_NAME_LENGTH);
    if (!name || name.length === 0) {
        errors.push("Name is required and must be a non-empty string");
    }

    const color = validateColor(i.color);
    if (!color) {
        errors.push("Color is required and must be in hex format (#RRGGBB)");
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        data: {
            name: name!,
            color: color!,
        },
        errors: [],
    };
}
