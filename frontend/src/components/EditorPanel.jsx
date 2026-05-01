import React, { useEffect } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'

const EditorPanel = ({ openFiles, currentFile, setCurrentFile, fileTree, setFileTree, saveFileTree, runProject, webContainer }) => {
    const monaco = useMonaco();
    
    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme('soenDark', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': '#0d0d14',
                    'editorLineNumber.foreground': '#334155',
                    'editorLineNumber.activeForeground': '#3b82f6',
                    'editor.lineHighlightBackground': '#3b82f61a', // subtle blue glow
                }
            });
            monaco.editor.setTheme('soenDark');
        }
    }, [monaco]);

    const handleEditorChange = (value) => {
        const ft = {
            ...fileTree,
            [currentFile]: {
                file: {
                    contents: value
                }
            }
        }
        setFileTree(ft)
        saveFileTree(ft)
    }

    const getFileIcon = (filename) => {
        if (!filename.includes('.')) return 'ri-folder-line text-[var(--ide-text-muted)]';
        if (filename.endsWith('.jsx')) return 'ri-reactjs-line text-blue-400';
        if (filename.endsWith('.js')) return 'ri-javascript-line text-orange-400';
        if (filename.endsWith('.json')) return 'ri-braces-line text-slate-400';
        if (filename.endsWith('.css')) return 'ri-css3-line text-purple-400';
        return 'ri-file-code-line text-[var(--ide-text-secondary)]';
    }

    return (
        <div className="flex flex-col flex-grow h-full min-w-0 bg-[var(--ide-bg)]">
            {/* Tab Bar (32px) */}
            <div className="h-[32px] flex w-full bg-[var(--ide-surface)] border-b border-[var(--ide-border)] overflow-x-auto scrollbar-hide shrink-0">
                {openFiles.length === 0 ? (
                    <div className="flex items-center px-4 text-[10px] text-[var(--ide-text-muted)] font-medium">No files open</div>
                ) : (
                    openFiles.map((file, index) => {
                        const isActive = currentFile === file;
                        return (
                            <button
                                key={index}
                                onClick={() => setCurrentFile(file)}
                                className={`group flex items-center gap-2 h-full px-4 border-r border-[var(--ide-border)] transition-colors relative min-w-max ${isActive ? 'bg-[var(--ide-bg)] text-[var(--ide-text-active)]' : 'bg-[var(--ide-surface)] text-[var(--ide-text-secondary)] hover:bg-[var(--ide-bg)]'}`}
                            >
                                {isActive && <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--ide-accent)]"></div>}
                                <i className={`${getFileIcon(file)} text-[14px]`}></i>
                                <span className='font-medium text-[11px]'>{file}</span>
                                <div className={`w-1.5 h-1.5 rounded-full ml-1 transition-colors ${isActive ? 'bg-[var(--ide-accent)]' : 'bg-transparent group-hover:bg-[var(--ide-border)]'}`}></div>
                            </button>
                        );
                    })
                )}
            </div>
            
            <div className="flex-grow max-w-full overflow-hidden relative">
                {
                    currentFile && fileTree[currentFile] ? (
                        <Editor
                            height="100%"
                            defaultLanguage={currentFile.endsWith('.css') ? 'css' : currentFile.endsWith('.json') ? 'json' : 'javascript'}
                            path={currentFile}
                            value={fileTree[currentFile].file.contents}
                            onChange={handleEditorChange}
                            theme="soenDark"
                            options={{
                                fontSize: 13,
                                fontFamily: 'var(--font-mono)',
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 16 },
                                renderLineHighlight: "all",
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--ide-text-muted)] gap-4">
                            <i className="ri-code-s-slash-line text-4xl opacity-20"></i>
                            <p className="text-xs uppercase tracking-widest font-bold">Select a file to edit</p>
                        </div>
                    )
                }
            </div>
        </div>
    )
}

export default EditorPanel

