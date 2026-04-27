import React from 'react'
import Editor from '@monaco-editor/react'

const EditorPanel = ({ openFiles, currentFile, setCurrentFile, fileTree, setFileTree, saveFileTree, runProject, webContainer }) => {
    
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

    return (
        <div className="code-editor flex flex-col flex-grow h-full min-w-0">
            <div className="top flex justify-between w-full p-2 bg-slate-200 min-w-0">
                <div className="files flex gap-1 overflow-x-auto scrollbar-hide min-w-0 pr-4">
                    {
                        openFiles.map((file, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentFile(file)}
                                className={`open-file cursor-pointer p-1 px-3 flex items-center w-fit gap-2 rounded-t-md transition-colors ${currentFile === file ? 'bg-slate-50 text-slate-900' : 'bg-slate-300 text-slate-600 hover:bg-slate-400'}`}>
                                <p className='font-medium text-sm'>{file}</p>
                            </button>
                        ))
                    }
                </div>
                <div className="actions flex gap-2">
                    <button
                        onClick={runProject}
                        className='p-1 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors'
                    >
                        Run
                    </button>
                </div>
            </div>
            <div className="bottom flex-grow max-w-full overflow-hidden">
                {
                    currentFile && fileTree[currentFile] && (
                        <Editor
                            height="100%"
                            defaultLanguage="javascript"
                            path={currentFile}
                            value={fileTree[currentFile].file.contents}
                            onChange={handleEditorChange}
                            theme="vs-dark"
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    )
                }
            </div>
        </div>
    )
}

export default EditorPanel

