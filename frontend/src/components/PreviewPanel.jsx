import React from 'react'

const PreviewPanel = ({ iframeUrl, setIframeUrl, webContainer }) => {
    if (!iframeUrl || !webContainer) return null;

    return (
        <div className="flex min-w-96 flex-col h-full">
            <div className="address-bar">
                <input 
                    type="text"
                    onChange={(e) => setIframeUrl(e.target.value)}
                    value={iframeUrl} 
                    className="w-full p-2 px-4 bg-slate-200" 
                />
            </div>
            <iframe src={iframeUrl} className="w-full h-full"></iframe>
        </div>
    )
}

export default PreviewPanel
