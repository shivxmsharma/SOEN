import React from 'react'

const FileTree = ({ fileTree, setCurrentFile, setOpenFiles, openFiles, currentFile }) => {
    return (
        <div className="explorer h-full w-64 max-w-full bg-slate-800 border-r border-slate-700 flex flex-col">
            <header className='p-3 px-4 border-b border-slate-700 flex justify-between items-center'>
                <h2 className='text-slate-100 font-semibold text-sm tracking-tight'>Files</h2>
                <i className="ri-file-add-line text-slate-400 hover:text-white cursor-pointer transition-colors"></i>
            </header>
            <div className="file-tree w-full py-2 overflow-auto">
                {
                    Object.keys(fileTree).map((file, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setCurrentFile(file)
                                setOpenFiles([ ...new Set([ ...openFiles, file ]) ])
                            }}
                            className={`tree-element cursor-pointer p-2 px-4 flex items-center gap-2 w-full transition-all group ${currentFile === file ? 'bg-slate-700 text-blue-400 border-r-2 border-blue-400' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}>
                            <i className={`${file.includes('.') ? 'ri-file-code-line' : 'ri-folder-line'} text-lg ${currentFile === file ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}></i>
                            <p className='text-sm font-medium truncate'>{file}</p>
                        </button>))
                }
            </div>
        </div>
    )
}

export default FileTree

