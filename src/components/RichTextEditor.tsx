'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import {
    Bold, Italic, List, ListOrdered, Heading1, Heading2,
    Image, Undo, Redo, Upload, Link, X, Loader2
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TiptapImage.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg',
                },
            }),
        ],
        content,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'tiptap-editor focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // 上传图片
    const handleImageUpload = useCallback(async (file: File) => {
        if (!editor) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'editor');

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.success && data.url) {
                editor.chain().focus().setImage({ src: data.url }).run();
                setShowImageModal(false);
            } else {
                alert('图片上传失败');
            }
        } catch (error) {
            alert('图片上传失败');
        } finally {
            setUploading(false);
        }
    }, [editor]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
        e.target.value = '';
    };

    // 插入外链图片
    const handleInsertImageUrl = () => {
        if (!editor || !imageUrl.trim()) return;

        editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
        setImageUrl('');
        setShowImageModal(false);
    };

    if (!editor) {
        return <div className="min-h-[300px] border border-gray-200 rounded-lg animate-pulse bg-gray-100" />;
    }

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden relative">
            {/* 工具栏 */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
                    title="加粗"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
                    title="斜体"
                >
                    <Italic className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
                    title="标题 1"
                >
                    <Heading1 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
                    title="标题 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
                    title="无序列表"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
                    title="有序列表"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    title="插入图片"
                >
                    <Image className="w-4 h-4" />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="flex-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="p-2 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                    title="撤销"
                >
                    <Undo className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="p-2 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                    title="重做"
                >
                    <Redo className="w-4 h-4" />
                </button>
            </div>

            {/* 编辑区域 */}
            <EditorContent editor={editor} className="p-4 min-h-[300px]" />

            {/* 图片插入弹窗 */}
            {showImageModal && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">插入图片</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowImageModal(false);
                                    setImageUrl('');
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* 上传图片 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    上传图片
                                </label>
                                <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer">
                                    {uploading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    {uploading ? '上传中...' : '选择图片文件'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-1">支持 JPG、PNG、WebP，最大 5MB</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-gray-400 text-sm">或</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* 外链地址 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Link className="w-4 h-4 inline mr-1" />
                                    输入图片地址
                                </label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.png"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleInsertImageUrl();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowImageModal(false);
                                    setImageUrl('');
                                }}
                                className="flex-1 btn-secondary"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleInsertImageUrl}
                                disabled={!imageUrl.trim()}
                                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                插入图片
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
