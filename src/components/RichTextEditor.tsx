'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import VideoExtension from '@/lib/tiptap/video-extension';
import {
    Bold, Italic, List, ListOrdered, Heading1, Heading2,
    Image, Undo, Redo, Upload, CloudUpload, Link, X, Loader2,
    Video as VideoIcon, History, Image as ImageIcon
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const getEmbedUrl = (url: string): string => {
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch && youtubeMatch[1]) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Bilibili
    // Support BV id: https://www.bilibili.com/video/BV1xx411c7mD
    const bilibiliRegex = /bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/;
    const bilibiliMatch = url.match(bilibiliRegex);
    if (bilibiliMatch && bilibiliMatch[1]) {
        return `https://player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&page=1&high_quality=1&danmaku=0`;
    }
    
    return url;
};

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // 历史图片相关
    const [showHistory, setShowHistory] = useState(false);
    const [historyImages, setHistoryImages] = useState<{ url: string; filename: string }[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(0);
    const [historySearch, setHistorySearch] = useState('');
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyError, setHistoryError] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit,
            TiptapImage,
            VideoExtension,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        immediatelyRender: false,
    });

    // 获取历史图片
    const fetchHistory = async (page = 1, keyword = '') => {
        setLoadingHistory(true);
        setHistoryError('');
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                keyword: keyword
            });
            const res = await fetch(`/api/upload/smms/history?${query}`);
            const data = await res.json();
            if (data.success) {
                setHistoryImages(data.data);
                if (data.pagination) {
                    setHistoryTotalPages(data.pagination.totalPages);
                    setHistoryPage(data.pagination.page);
                    setHistoryTotal(data.pagination.total);
                }
            } else {
                setHistoryError(data.error || '获取历史记录失败');
            }
        } catch (error) {
            console.error(error);
            setHistoryError('获取历史记录失败');
        } finally {
            setLoadingHistory(false);
        }
    };

    // 切换历史图片显示
    const toggleHistory = () => {
        if (!showHistory) {
            setHistoryPage(1);
            setHistorySearch('');
            setHistoryError('');
            fetchHistory(1, '');
        }
        setShowHistory(!showHistory);
    };

    // 搜索历史图片
    const handleHistorySearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchHistory(1, historySearch);
    };

    // 翻页
    const handleHistoryPageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= historyTotalPages) {
            fetchHistory(newPage, historySearch);
        }
    };

    // 选择历史图片
    const selectHistoryImage = (url: string) => {
        if (!editor) return;
        editor.chain().focus().setImage({ src: url }).run();
        setShowImageModal(false);
        setShowHistory(false);
        setImageUrl('');
    };

    // 上传图片
    const handleImageUpload = useCallback(async (file: File) => {
        if (!editor) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await fetch('/api/upload/smms', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.success && data.url) {
                editor.chain().focus().setImage({ src: data.url }).run();
                setShowImageModal(false);
            } else {
                alert(data.error || '图片上传失败');
            }
        } catch (error) {
            console.error('Upload error:', error);
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

    // 插入视频
    const handleInsertVideo = () => {
        if (!editor || !videoUrl.trim()) return;

        const finalUrl = getEmbedUrl(videoUrl.trim());
        editor.chain().focus().setVideo({ src: finalUrl }).run();
        setVideoUrl('');
        setShowVideoModal(false);
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
                <button
                    type="button"
                    onClick={() => setShowVideoModal(true)}
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    title="插入视频"
                >
                    <VideoIcon className="w-4 h-4" />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e)}
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
                            <div className="flex items-center gap-2">
                                {showHistory && (
                                    <form onSubmit={handleHistorySearch} className="flex gap-2 mr-2">
                                        <input
                                            type="text"
                                            placeholder="搜索图片..."
                                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
                                            value={historySearch}
                                            onChange={(e) => setHistorySearch(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-sm hover:bg-blue-100 font-medium whitespace-nowrap"
                                        >
                                            搜索
                                        </button>
                                    </form>
                                )}
                                <button
                                    type="button"
                                    onClick={toggleHistory}
                                    className={`p-1.5 rounded flex items-center gap-1 text-sm font-medium transition-colors ${
                                        showHistory ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    <History className="w-4 h-4" />
                                    {showHistory ? '返回上传' : '历史图片'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowImageModal(false);
                                        setImageUrl('');
                                        setShowHistory(false);
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {showHistory ? (
                            <div className="min-h-[300px] flex flex-col">
                                <div className="flex-1 overflow-y-auto max-h-[400px]">
                                    {loadingHistory ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                            <p>加载中...</p>
                                        </div>
                                    ) : historyError ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-red-500 bg-red-50 rounded-lg border border-red-200 h-full mx-1">
                                            <p className="font-bold mb-2">获取图片失败</p>
                                            <p className="text-sm text-center max-w-xs">{historyError}</p>
                                        </div>
                                    ) : historyImages.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {historyImages.map((img, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => selectHistoryImage(img.url)}
                                                    className="group cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 hover:border-transparent transition-all relative aspect-square w-full"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={img.url}
                                                        alt={img.filename}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity text-left">
                                                        {img.filename}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 h-full">
                                            <ImageIcon className="w-12 h-12 text-gray-300 mb-2" />
                                            <p>暂无上传记录</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            disabled={historyPage <= 1}
                                            onClick={() => handleHistoryPageChange(historyPage - 1)}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm"
                                        >
                                            上一页
                                        </button>
                                        <span className="font-medium text-gray-700 min-w-[3rem] text-center text-sm">
                                            {historyPage} / {Math.max(1, historyTotalPages)}
                                        </span>
                                        <button 
                                            disabled={historyPage >= historyTotalPages}
                                            onClick={() => handleHistoryPageChange(historyPage + 1)}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm"
                                        >
                                            下一页
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* 上传图片 */}
                                <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    上传图片
                                </label>
                                <div className="flex gap-2">
                                    <label className="btn-secondary flex-1 inline-flex items-center justify-center gap-2 cursor-pointer bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100">
                                        {uploading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CloudUpload className="w-4 h-4" />
                                        )}
                                        {uploading ? '上传中...' : 'SM.MS 图床上传'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileSelect(e)}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
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
                        )}

                        {!showHistory && (
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
                        )}
                    </div>
                </div>
            )}
            {/* 视频插入弹窗 */}
            {showVideoModal && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">插入视频</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowVideoModal(false);
                                    setVideoUrl('');
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <VideoIcon className="w-4 h-4 inline mr-1" />
                                    视频播放地址 (MP4/WebM)
                                </label>
                                <input
                                    type="url"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://example.com/video.mp4"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleInsertVideo();
                                        }
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-1">请输入视频文件的直链地址</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowVideoModal(false);
                                    setVideoUrl('');
                                }}
                                className="flex-1 btn-secondary"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleInsertVideo}
                                disabled={!videoUrl.trim()}
                                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                插入视频
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
