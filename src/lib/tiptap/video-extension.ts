
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
    ];
  },

  renderHTML({ HTMLAttributes }) {
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
