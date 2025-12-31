'use client';

import { useState } from 'react';
import { Category, Tag } from '@/types';
import { CategoryBadge, TagBadge, Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, ChevronRight, X, LayoutGrid } from 'lucide-react';

interface TodoSidebarProps {
    categories: Category[];
    tags: Tag[];
    selectedCategory: string | null;
    selectedTag: string | null;
    onSelectCategory: (id: string | null) => void;
    onSelectTag: (id: string | null) => void;
    onAddCategory?: (name: string, icon: string, color: string) => void;
    onDeleteCategory?: (id: string) => void;
    onAddTag?: (name: string, color: string) => void;
    onDeleteTag?: (id: string) => void;
    todoCountByCategory: Record<string, number>;
    todoCountByTag: Record<string, number>;
    totalTodos: number;
    isOpen?: boolean;
    onClose?: () => void;
}

const COLORS = [
    '#6366f1', '#f59e0b', '#10b981', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export function TodoSidebar({
    categories,
    tags,
    selectedCategory,
    selectedTag,
    onSelectCategory,
    onSelectTag,
    onAddCategory,
    onDeleteCategory,
    onAddTag,
    onDeleteTag,
    todoCountByCategory,
    todoCountByTag,
    totalTodos,
    isOpen = false,
    onClose,
}: TodoSidebarProps) {
    const [showCategories, setShowCategories] = useState(true);
    const [showTags, setShowTags] = useState(true);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const handleAddCategory = () => {
        if (newCategoryName.trim() && onAddCategory) {
            onAddCategory(newCategoryName.trim(), 'Folder', selectedColor);
            setNewCategoryName('');
            setIsAddingCategory(false);
            setSelectedColor(COLORS[0]);
        }
    };

    const handleAddTag = () => {
        if (newTagName.trim() && onAddTag) {
            onAddTag(newTagName.trim(), selectedColor);
            setNewTagName('');
            setIsAddingTag(false);
            setSelectedColor(COLORS[0]);
        }
    };

    return (
        <aside
            className={cn(
                'shrink-0 border-r border-gray-200 p-4',
                'transition-transform duration-300 ease-in-out',
                // Mobile: solid background, Desktop: semi-transparent
                'bg-gray-50 md:bg-gray-50/50',
                // Desktop: always visible, fixed width
                'md:relative md:translate-x-0 md:w-64',
                // Mobile: fixed position, slide in/out
                'fixed inset-y-0 left-0 z-50 w-[70vw] max-w-70',
                isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            )}
        >
            {/* Mobile close button */}
            <button
                onClick={onClose}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 md:hidden"
                aria-label="Close menu"
            >
                <X className="h-5 w-5" />
            </button>

            {/* All tasks */}
            <button
                onClick={() => {
                    onSelectCategory(null);
                    onSelectTag(null);
                    onClose?.();
                }}
                className={cn(
                    'mb-4 flex w-full items-center justify-between rounded-lg px-3 py-2 mt-8 md:mt-0',
                    'text-sm font-medium text-gray-700',
                    'transition-colors duration-150',
                    'hover:bg-gray-100',
                    !selectedCategory && !selectedTag && 'bg-white shadow-sm'
                )}
            >
                <span className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <span>All tasks</span>
                </span>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                    {totalTodos}
                </span>
            </button>

            {/* Categories section */}
            <div className="mb-4">
                <button
                    onClick={() => setShowCategories(!showCategories)}
                    className="mb-2 flex w-full items-center gap-1 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
                >
                    {showCategories ? (
                        <ChevronDown className="h-3 w-3" />
                    ) : (
                        <ChevronRight className="h-3 w-3" />
                    )}
                    Categories
                </button>

                {showCategories && (
                    <div className="space-y-1">
                        {categories.map((category) => {
                            return (
                                <div
                                    key={category.id}
                                    className={cn(
                                        'group flex items-center justify-between rounded-lg px-3 py-1.5',
                                        'transition-colors duration-150',
                                        'hover:bg-gray-100',
                                        selectedCategory === category.id && 'bg-white shadow-sm'
                                    )}
                                >
                                    <button
                                        onClick={() => {
                                            onSelectCategory(category.id);
                                            onSelectTag(null);
                                            onClose?.();
                                        }}
                                        className="flex flex-1 items-center gap-2"
                                    >
                                        <CategoryBadge category={category} size="sm" />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-400">
                                            {todoCountByCategory[category.id] || 0}
                                        </span>
                                        {onDeleteCategory && (
                                            <button
                                                onClick={() => onDeleteCategory(category.id)}
                                                className="rounded p-0.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add category form */}
                        {isAddingCategory ? (
                            <div className="space-y-2 rounded-lg bg-white p-2 shadow-sm">
                                <Input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Category name"
                                    className="text-sm"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                />
                                <div className="flex flex-wrap gap-1">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={cn(
                                                'h-5 w-5 rounded-full transition-transform',
                                                selectedColor === color && 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-1">
                                    <Button size="sm" onClick={handleAddCategory}>
                                        Add
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsAddingCategory(false);
                                            setNewCategoryName('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingCategory(true)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            >
                                <Plus className="h-4 w-4" />
                                New category
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Tags section */}
            <div>
                <button
                    onClick={() => setShowTags(!showTags)}
                    className="mb-2 flex w-full items-center gap-1 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
                >
                    {showTags ? (
                        <ChevronDown className="h-3 w-3" />
                    ) : (
                        <ChevronRight className="h-3 w-3" />
                    )}
                    Tags
                </button>

                {showTags && (
                    <div className="space-y-1">
                        {tags.map((tag) => (
                            <div
                                key={tag.id}
                                className={cn(
                                    'group flex items-center justify-between rounded-lg px-3 py-1.5',
                                    'transition-colors duration-150',
                                    'hover:bg-gray-100',
                                    selectedTag === tag.id && 'bg-white shadow-sm'
                                )}
                            >
                                <button
                                    onClick={() => {
                                        onSelectTag(tag.id);
                                        onSelectCategory(null);
                                        onClose?.();
                                    }}
                                    className="flex flex-1 items-center gap-2"
                                >
                                    <TagBadge tag={tag} size="sm" />
                                </button>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-400">
                                        {todoCountByTag[tag.id] || 0}
                                    </span>
                                    {onDeleteTag && (
                                        <button
                                            onClick={() => onDeleteTag(tag.id)}
                                            className="rounded p-0.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Add tag form */}
                        {isAddingTag ? (
                            <div className="space-y-2 rounded-lg bg-white p-2 shadow-sm">
                                <Input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder="Tag name"
                                    className="text-sm"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                />
                                <div className="flex flex-wrap gap-1">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={cn(
                                                'h-5 w-5 rounded-full transition-transform',
                                                selectedColor === color && 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-1">
                                    <Button size="sm" onClick={handleAddTag}>
                                        Add
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsAddingTag(false);
                                            setNewTagName('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingTag(true)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            >
                                <Plus className="h-4 w-4" />
                                New tag
                            </button>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
