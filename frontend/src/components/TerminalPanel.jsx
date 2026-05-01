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
                    background: '#070710',
                    foreground: '#94a3b8',
                    cursor: '#e2e8f0',
                    selectionBackground: '#3b82f640',
                },
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
            })

            const fitAddon = new FitAddon()
            termInstance.current.loadAddon(fitAddon)
            termInstance.current.open(terminalRef.current)
            
            // Wait for DOM to settle
            setTimeout(() => {
                fitAddon.fit()
            }, 10)

            // Handle window resize
            const handleResize = () => {
                try {
                    fitAddon.fit()
                } catch (e) {
                    // Ignore resize errors when hidden
                }
            }
            window.addEventListener('resize', handleResize)
            
            return () => {
                window.removeEventListener('resize', handleResize)
                if (termInstance.current) {
                    termInstance.current.dispose()
                    termInstance.current = null
                }
            }
        }
    }, [])

    useEffect(() => {
        if (termInstance.current && terminalOutput) {
            termInstance.current.write(terminalOutput)
        }
    }, [terminalOutput])

    return (
        <div className="terminal-container h-full w-full bg-[var(--ide-terminal)] p-2 pl-4 overflow-hidden">
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    )
}

export default TerminalPanel
