
import { Node, mergeAttributes } from '@tiptap/core';

export interface VideoOptions {
  allowFullscreen: boolean;
  controls: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      /**
       * Add a video node
       */
      setVideo: (options: { src: string }) => ReturnType;
    };
  }
}

export const Video = Node.create<VideoOptions>({
  name: 'video',

  group: 'block',

  content: 'inline*',

  draggable: true,

  isolating: true,

  addOptions() {
    return {
      allowFullscreen: true,
      controls: true,
      HTMLAttributes: {
        class: 'w-full h-auto rounded-lg my-4',
      },
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
        getAttrs: (element) => ({
          src: (element as HTMLElement).getAttribute('src'),
        }),
      },
      {
        tag: 'iframe',
        getAttrs: (element) => ({
          src: (element as HTMLElement).getAttribute('src'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src as string;
    const isEmbed = src.includes('youtube.com') || src.includes('youtu.be') || src.includes('bilibili.com') || src.includes('player.bilibili.com');

    if (isEmbed) {
      return [
        'div',
        { class: 'aspect-video w-full my-4 rounded-lg overflow-hidden' },
        [
          'iframe',
          mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
            class: 'w-full h-full',
            frameborder: '0',
            allowfullscreen: 'true',
            sandbox: 'allow-scripts allow-same-origin allow-popups allow-presentation',
          }),
        ],
      ];
    }

    return [
      'video',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        controls: this.options.controls,
      }),
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

export default Video;
