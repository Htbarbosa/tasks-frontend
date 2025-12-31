'use client';

import { useState, useEffect, useCallback } from 'react';
import { Todo, Category, Tag, TodoState, DEFAULT_CATEGORIES, DEFAULT_TAGS } from '@/types';

const STORAGE_KEY = 'notion-todo-app';

interface UseApiTodosReturn {
    // State
    todos: Todo[];
    categories: Category[];
    tags: Tag[];
    isLoaded: boolean;
    isLoading: boolean;
    error: string | null;

    // Todo operations
    addTodo: (title: string, categoryId?: string | null, tagIds?: string[]) => Promise<Todo | undefined>;
    updateTodo: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => Promise<void>;
    toggleTodo: (id: string) => Promise<void>;
    deleteTodo: (id: string) => Promise<void>;
    reorderTodos: (fromIndex: number, toIndex: number) => Promise<void>;

    // Category operations
    addCategory: (name: string, icon: string, color: string) => Promise<Category | undefined>;
    deleteCategory: (id: string) => Promise<void>;

    // Tag operations
    addTag: (name: string, color: string) => Promise<Tag | undefined>;
    deleteTag: (id: string) => Promise<void>;

    // Utility functions
    getCategoryById: (id: string | null) => Category | null;
    getTagById: (id: string) => Tag | null;
    getTodosByCategory: (categoryId: string | null) => Todo[];
    getTodosByTag: (tagId: string) => Todo[];
}

export function useApiTodos(): UseApiTodosReturn {
    const [state, setState] = useState<TodoState>({
        todos: [],
        categories: DEFAULT_CATEGORIES,
        tags: DEFAULT_TAGS,
    });
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load data from API on mount, handle migration if needed
    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch user data from API
                const response = await fetch('/api/data');

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const data = await response.json();

                // Check if migration is needed
                if (!data.migrated) {
                    // Try to get localStorage data for migration
                    const localData = localStorage.getItem(STORAGE_KEY);

                    if (localData) {
                        try {
                            const parsedData: TodoState = JSON.parse(localData);

                            // Migrate localStorage data to server
                            const migrateResponse = await fetch('/api/data', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(parsedData),
                            });

                            if (migrateResponse.ok) {
                                const migratedData = await migrateResponse.json();
                                console.log('Migration successful:', migratedData);

                                // Fetch the migrated data
                                const refreshResponse = await fetch('/api/data');
                                if (refreshResponse.ok) {
                                    const refreshedData = await refreshResponse.json();
                                    setState({
                                        todos: refreshedData.todos || [],
                                        categories: refreshedData.categories || DEFAULT_CATEGORIES,
                                        tags: refreshedData.tags || DEFAULT_TAGS,
                                    });

                                    // Clear localStorage after successful migration
                                    localStorage.removeItem(STORAGE_KEY);
                                }
                            } else {
                                const errorData = await migrateResponse.json();
                                console.error('Migration failed:', errorData);
                                // Continue with server data even if migration fails
                            }
                        } catch (parseError) {
                            console.error('Failed to parse localStorage data:', parseError);
                        }
                    }
                }

                // Set state from server data
                setState({
                    todos: data.todos || [],
                    categories: data.categories?.length > 0 ? data.categories : DEFAULT_CATEGORIES,
                    tags: data.tags?.length > 0 ? data.tags : DEFAULT_TAGS,
                });
            } catch (err) {
                console.error('Failed to load data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load data');

                // Fallback to localStorage if API fails
                const localData = localStorage.getItem(STORAGE_KEY);
                if (localData) {
                    try {
                        const parsedData: TodoState = JSON.parse(localData);
                        setState(parsedData);
                    } catch {
                        // Use default state
                    }
                }
            } finally {
                setIsLoaded(true);
                setIsLoading(false);
            }
        }

        loadData();
    }, []);

    // Todo operations
    const addTodo = useCallback(
        async (title: string, categoryId: string | null = null, tagIds: string[] = []) => {
            try {
                const response = await fetch('/api/todos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, categoryId, tags: tagIds }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create todo');
                }

                const newTodo: Todo = await response.json();

                setState((prev) => ({
                    ...prev,
                    todos: [newTodo, ...prev.todos],
                }));

                return newTodo;
            } catch (err) {
                console.error('Failed to add todo:', err);
                setError(err instanceof Error ? err.message : 'Failed to add todo');
            }
        },
        []
    );

    const updateTodo = useCallback(
        async (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
            // Optimistic update
            setState((prev) => ({
                ...prev,
                todos: prev.todos.map((todo) =>
                    todo.id === id
                        ? { ...todo, ...updates, updatedAt: new Date().toISOString() }
                        : todo
                ),
            }));

            try {
                const response = await fetch(`/api/todos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                });

                if (!response.ok) {
                    throw new Error('Failed to update todo');
                }

                const updatedTodo: Todo = await response.json();

                setState((prev) => ({
                    ...prev,
                    todos: prev.todos.map((todo) =>
                        todo.id === id ? updatedTodo : todo
                    ),
                }));
            } catch (err) {
                console.error('Failed to update todo:', err);
                setError(err instanceof Error ? err.message : 'Failed to update todo');
                // Revert optimistic update by reloading
            }
        },
        []
    );

    const toggleTodo = useCallback(
        async (id: string) => {
            const todo = state.todos.find((t) => t.id === id);
            if (!todo) return;

            await updateTodo(id, { completed: !todo.completed });
        },
        [state.todos, updateTodo]
    );

    const deleteTodo = useCallback(
        async (id: string) => {
            // Optimistic update
            setState((prev) => ({
                ...prev,
                todos: prev.todos.filter((todo) => todo.id !== id),
            }));

            try {
                const response = await fetch(`/api/todos/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete todo');
                }
            } catch (err) {
                console.error('Failed to delete todo:', err);
                setError(err instanceof Error ? err.message : 'Failed to delete todo');
            }
        },
        []
    );

    const reorderTodos = useCallback(
        async (fromIndex: number, toIndex: number) => {
            // Optimistic update
            setState((prev) => {
                const newTodos = [...prev.todos];
                const [removed] = newTodos.splice(fromIndex, 1);
                newTodos.splice(toIndex, 0, removed);
                return { ...prev, todos: newTodos };
            });

            try {
                const response = await fetch('/api/todos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'reorder', fromIndex, toIndex }),
                });

                if (!response.ok) {
                    throw new Error('Failed to reorder todos');
                }
            } catch (err) {
                console.error('Failed to reorder todos:', err);
                setError(err instanceof Error ? err.message : 'Failed to reorder todos');
            }
        },
        []
    );

    // Category operations
    const addCategory = useCallback(
        async (name: string, icon: string, color: string) => {
            try {
                const response = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, icon, color }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create category');
                }

                const newCategory: Category = await response.json();

                setState((prev) => ({
                    ...prev,
                    categories: [...prev.categories, newCategory],
                }));

                return newCategory;
            } catch (err) {
                console.error('Failed to add category:', err);
                setError(err instanceof Error ? err.message : 'Failed to add category');
            }
        },
        []
    );

    const deleteCategory = useCallback(
        async (id: string) => {
            // Optimistic update
            setState((prev) => ({
                ...prev,
                categories: prev.categories.filter((cat) => cat.id !== id),
                todos: prev.todos.map((todo) =>
                    todo.categoryId === id ? { ...todo, categoryId: null } : todo
                ),
            }));

            try {
                const response = await fetch(`/api/categories/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete category');
                }
            } catch (err) {
                console.error('Failed to delete category:', err);
                setError(err instanceof Error ? err.message : 'Failed to delete category');
            }
        },
        []
    );

    // Tag operations
    const addTag = useCallback(
        async (name: string, color: string) => {
            try {
                const response = await fetch('/api/tags', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, color }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create tag');
                }

                const newTag: Tag = await response.json();

                setState((prev) => ({
                    ...prev,
                    tags: [...prev.tags, newTag],
                }));

                return newTag;
            } catch (err) {
                console.error('Failed to add tag:', err);
                setError(err instanceof Error ? err.message : 'Failed to add tag');
            }
        },
        []
    );

    const deleteTag = useCallback(
        async (id: string) => {
            // Optimistic update
            setState((prev) => ({
                ...prev,
                tags: prev.tags.filter((tag) => tag.id !== id),
                todos: prev.todos.map((todo) => ({
                    ...todo,
                    tags: todo.tags.filter((tagId) => tagId !== id),
                })),
            }));

            try {
                const response = await fetch(`/api/tags/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete tag');
                }
            } catch (err) {
                console.error('Failed to delete tag:', err);
                setError(err instanceof Error ? err.message : 'Failed to delete tag');
            }
        },
        []
    );

    // Utility functions
    const getCategoryById = useCallback(
        (id: string | null) => {
            if (!id) return null;
            return state.categories.find((cat) => cat.id === id) || null;
        },
        [state.categories]
    );

    const getTagById = useCallback(
        (id: string) => {
            return state.tags.find((tag) => tag.id === id) || null;
        },
        [state.tags]
    );

    const getTodosByCategory = useCallback(
        (categoryId: string | null) => {
            return state.todos.filter((todo) => todo.categoryId === categoryId);
        },
        [state.todos]
    );

    const getTodosByTag = useCallback(
        (tagId: string) => {
            return state.todos.filter((todo) => todo.tags.includes(tagId));
        },
        [state.todos]
    );

    return {
        // State
        todos: state.todos,
        categories: state.categories,
        tags: state.tags,
        isLoaded,
        isLoading,
        error,

        // Todo operations
        addTodo,
        updateTodo,
        toggleTodo,
        deleteTodo,
        reorderTodos,

        // Category operations
        addCategory,
        deleteCategory,

        // Tag operations
        addTag,
        deleteTag,

        // Utility functions
        getCategoryById,
        getTagById,
        getTodosByCategory,
        getTodosByTag,
    };
}
