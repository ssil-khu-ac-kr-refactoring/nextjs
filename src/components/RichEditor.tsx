'use client';
import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-plus';
import { toast } from '@/components/Toast';

Quill.register('modules/imageResize', ImageResize);

export type RichEditorHandle = {
  getHTML: () => string;
  setHTML: (html: string) => void;
  focus: () => void;
  clear: () => void;
};

type Props = {
  value?: string;
  defaultValue?: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
  minHeight?: number;
  placeholder?: string;
  uploadEndpoint?: string;
  uploadExtra?: Record<string, string>;
};

export const RichEditor = React.forwardRef<RichEditorHandle, Props>(
  (
    {
      value,
      defaultValue = '',
      onChange,
      readOnly = false,
      minHeight = 300,
      placeholder = 'Start writing...',
      uploadEndpoint = '/api/upload',
      uploadExtra,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const quillRef = useRef<any>(null);
    const didInit = useRef(false);
    const latestValueRef = useRef<string>('');
    latestValueRef.current = typeof value === 'string' ? value : (defaultValue ?? '');

    useEffect(() => {
      if (didInit.current) return;
      didInit.current = true;

      (async () => {
        const Quill = (await import('quill')).default;

        const toolbar = [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link', 'image', 'video'],
          ['clean'],
        ];

        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        quillRef.current = new Quill(containerRef.current, {
          theme: 'snow',
          readOnly,
          placeholder,
          modules: {
            toolbar: readOnly ? false : { container: toolbar },
            clipboard: { matchVisual: false },
            imageResize: { modules: ['Resize', 'DisplaySize', 'Toolbar'] },
          },
        });

        if (!readOnly) {
          const toolbarModule = quillRef.current.getModule('toolbar');
          toolbarModule?.addHandler('image', async () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              try {
                const fd = new FormData();
                fd.append('file', file);
                if (uploadExtra) Object.entries(uploadExtra).forEach(([k, v]) => fd.append(k, v));

                const res = await fetch(uploadEndpoint, { method: 'POST', body: fd });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || 'Upload failed');

                let range = quillRef.current.getSelection(true);
                if (!range) {
                  const len = quillRef.current.getLength();
                  range = { index: len - 1, length: 0 };
                }

                quillRef.current.insertEmbed(range.index, 'image', data.url, 'user');
              } catch (e) {
                console.error(e);
                toast.error('이미지 업로드 실패');
              }
            };
            input.click();
          });
        }

        quillRef.current.on('text-change', (_d: any, _o: any, source: 'user' | 'api') => {
          if (source === 'user' && onChange) {
            onChange(quillRef.current.root.innerHTML);
          }
        });

        const initial = latestValueRef.current || '';
        if (initial) {
          quillRef.current.clipboard.dangerouslyPasteHTML(0, initial, 'silent');
        }
      })();

      return () => {
        if (quillRef.current) {
          quillRef.current.off('text-change');
          quillRef.current = null;
        }
      };
    }, [readOnly, placeholder, uploadEndpoint, uploadExtra]);

    useEffect(() => {
      if (!quillRef.current) return;
      const incoming = typeof value === 'string' ? value : '';
      const current = quillRef.current.root.innerHTML;
      if (incoming !== current) {
        quillRef.current.clipboard.dangerouslyPasteHTML(0, incoming, 'silent');
      }
    }, [value, defaultValue]);

    useImperativeHandle(ref, () => ({
      getHTML: () => quillRef.current?.root?.innerHTML ?? '',
      setHTML: (html: string) => {
        if (!quillRef.current) return;
        quillRef.current.clipboard.dangerouslyPasteHTML(0, html || '', 'api');
      },
      focus: () => quillRef.current?.focus?.(),
      clear: () => quillRef.current?.setText?.('', 'api'),
    }));

    return (
      <div
        className={`
          rich-editor-wrapper rounded-lg transition-colors
          bg-[hsl(var(--card))] border-[hsl(var(--border))]
          dark:bg-[hsl(var(--background))] dark:border-[hsl(var(--border))]
        `}
      >
        <div ref={containerRef} style={{ minHeight }} />
      </div>
    );
  }
);

// ✅ ESLint 'react/display-name' 경고 해결
RichEditor.displayName = 'RichEditor';

export default RichEditor;
