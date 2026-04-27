import React from 'react'

const PreviewPanel = ({ iframeUrl, setIframeUrl, webContainer }) => {
    if (!iframeUrl || !webContainer) return null;

    return (
        <div className="flex w-96 max-w-full flex-col h-full bg-slate-900 border-l border-slate-700">
            <header className="address-bar p-2 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                <div className="flex gap-1.5 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <input 
                    type="text"
                    onChange={(e) => setIframeUrl(e.target.value)}
                    value={iframeUrl} 
                    className="flex-grow bg-slate-900 text-slate-300 text-xs p-1 px-3 rounded-md border border-slate-700 outline-none focus:border-blue-500 transition-colors" 
                />
                <i className="ri-refresh-line text-slate-400 hover:text-white cursor-pointer px-1"></i>
            </header>
            <div className="flex-grow bg-white">
                <iframe src={iframeUrl} className="w-full h-full border-none"></iframe>
            </div>
        </div>
    )
}

export default PreviewPanel

