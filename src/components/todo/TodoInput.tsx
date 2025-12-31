'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Category, Tag } from '@/types';
import { Input, Button, TagBadge, CategoryBadge } from '@/components/ui';
import { Plus, ChevronDown, Tag as TagIcon, Folder, X } from 'lucide-react';

interface TodoInputProps {
    categories: Category[];
    tags: Tag[];
    onAdd: (title: string, categoryId: string | null, tagIds: string[]) => void;
    defaultCategoryId?: string | null;
}

export function TodoInput({ categories, tags, onAdd, defaultCategoryId }: TodoInputProps) {
    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(defaultCategoryId ?? null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showTagPicker, setShowTagPicker] = useState(false);

    const categoryRef = useRef<HTMLDivElement>(null);
    const tagRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setShowCategoryPicker(false);
            }
            if (tagRef.current && !tagRef.current.contains(event.target as Node)) {
                setShowTagPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAdd(title.trim(), selectedCategory, selectedTags);
            setTitle('');
            setSelectedCategory(null);
            setSelectedTags([]);
        }
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
    };

    const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
    const selectedTagsData = tags.filter((t) => selectedTags.includes(t.id));

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Main input row */}
            <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                    <Plus className="h-5 w-5" />
                </div>
                <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add new task..."
                    variant="ghost"
                    className="flex-1 text-base"
                />
            </div>

            {/* Options row */}
            <div className="flex flex-wrap items-center gap-2 pl-11">
                {/* Category picker */}
                <div ref={categoryRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                        className={cn(
                            'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
                            'border border-dashed border-gray-300 text-gray-500',
                            'transition-colors duration-150',
                            'hover:border-gray-400 hover:bg-gray-50',
                            selectedCategory && 'border-solid'
                        )}
                    >
                        {selectedCategoryData ? (
                            <CategoryBadge category={selectedCategoryData} size="sm" />
                        ) : (
                            <>
                                <Folder className="h-3.5 w-3.5" />
                                <span>Category</span>
                            </>
                        )}
                        <ChevronDown className="h-3 w-3" />
                    </button>

                    {showCategoryPicker && (
                        <div className="absolute top-full left-0 z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setShowCategoryPicker(false);
                                }}
                                className={cn(
                                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-600',
                                    'transition-colors hover:bg-gray-100',
                                    !selectedCategory && 'bg-gray-50'
                                )}
                            >
                                <X className="h-4 w-4" />
                                None
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(category.id);
                                        setShowCategoryPicker(false);
                                    }}
                                    className={cn(
                                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                                        'transition-colors hover:bg-gray-100',
                                        selectedCategory === category.id && 'bg-gray-50'
                                    )}
                                >
                                    <CategoryBadge category={category} size="sm" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tag picker */}
                <div ref={tagRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setShowTagPicker(!showTagPicker)}
                        className={cn(
                            'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
                            'border border-dashed border-gray-300 text-gray-500',
                            'transition-colors duration-150',
                            'hover:border-gray-400 hover:bg-gray-50',
                            selectedTags.length > 0 && 'border-solid'
                        )}
                    >
                        <TagIcon className="h-3.5 w-3.5" />
                        <span>Tags {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
                        <ChevronDown className="h-3 w-3" />
                    </button>

                    {showTagPicker && (
                        <div className="absolute top-full left-0 z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                            {tags.map((tag) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleTag(tag.id)}
                                    className={cn(
                                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                                        'transition-colors hover:bg-gray-100',
                                        selectedTags.includes(tag.id) && 'bg-gray-50'
                                    )}
                                >
                                    <TagBadge tag={tag} size="sm" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected tags preview */}
                {selectedTagsData.length > 0 && (
                    <div className="flex items-center gap-1">
                        {selectedTagsData.map((tag) => (
                            <TagBadge
                                key={tag.id}
                                tag={tag}
                                size="sm"
                                onRemove={() => toggleTag(tag.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Submit button */}
                {title.trim() && (
                    <Button type="submit" size="sm" className="ml-auto">
                        Add
                    </Button>
                )}
            </div>
        </form>
    );
}
