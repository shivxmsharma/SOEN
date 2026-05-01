import React from 'react'

const FileTree = ({ fileTree, setCurrentFile, setOpenFiles, openFiles, currentFile }) => {
    
    const getFileColor = (filename) => {
        if (!filename.includes('.')) return 'text-[var(--ide-text-muted)]';
        if (filename.endsWith('.jsx')) return 'text-blue-400';
        if (filename.endsWith('.js')) return 'text-orange-400';
        if (filename.endsWith('.json')) return 'text-slate-400';
        if (filename.endsWith('.css')) return 'text-purple-400';
        return 'text-[var(--ide-text-secondary)]';
    }

    return (
        <div className="flex flex-col h-full bg-transparent w-full">
            <div className="w-full py-2 overflow-auto">
                {
                    Object.keys(fileTree).map((file, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setCurrentFile(file)
                                setOpenFiles([ ...new Set([ ...openFiles, file ]) ])
                            }}
                            className={`cursor-pointer p-1.5 px-3 flex items-center gap-2 w-full transition-all group border-l-2 ${currentFile === file ? 'bg-[var(--ide-accent)]/10 text-[var(--ide-text-active)] border-[var(--ide-accent)]' : 'border-transparent text-[var(--ide-text-secondary)] hover:bg-[var(--ide-border)] hover:text-[var(--ide-text-active)]'}`}>
                            <i className={`${file.includes('.') ? 'ri-file-code-line' : 'ri-folder-line'} text-[14px] ${currentFile === file ? 'text-[var(--ide-accent)]' : getFileColor(file)}`}></i>
                            <p className='text-[11px] font-medium truncate'>{file}</p>
                        </button>))
                }
            </div>
        </div>
    )
}

export default FileTree

