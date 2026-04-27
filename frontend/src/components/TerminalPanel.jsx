import React, { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const TerminalPanel = ({ terminalOutput }) => {
    const terminalRef = useRef(null)
    const termInstance = useRef(null)

    useEffect(() => {
        if (!termInstance.current && terminalRef.current) {
            termInstance.current = new Terminal({
                cursorBlink: true,
                theme: {
                    background: '#1e293b', // slate-800
                    foreground: '#f1f5f9', // slate-100
                },
                fontSize: 12,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            })

            const fitAddon = new FitAddon()
            termInstance.current.loadAddon(fitAddon)
            termInstance.current.open(terminalRef.current)
            fitAddon.fit()

            // Handle window resize
            window.addEventListener('resize', () => fitAddon.fit())
        }

        return () => {
            if (termInstance.current) {
                termInstance.current.dispose()
                termInstance.current = null
            }
        }
    }, [])

    useEffect(() => {
        if (termInstance.current && terminalOutput) {
            termInstance.current.write(terminalOutput)
        }
    }, [terminalOutput])

    return (
        <div className="terminal-container h-full w-full bg-slate-800 p-2 overflow-hidden">
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    )
}

export default TerminalPanel
