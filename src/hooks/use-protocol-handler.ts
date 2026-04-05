import { useEffect } from 'react'

export type ProtocolAction = 
  | { type: 'plant-memory'; data?: string }
  | { type: 'view-memory'; id: string }
  | { type: 'unknown'; protocol: string }

export function useProtocolHandler(onProtocolAction: (action: ProtocolAction) => void) {
  useEffect(() => {
    const handleProtocol = () => {
      const url = new URL(window.location.href)
      const searchParams = url.searchParams

      if (url.pathname === '/handle') {
        const protocolUrl = searchParams.get('protocol')
        if (protocolUrl) {
          const decodedUrl = decodeURIComponent(protocolUrl)
          
          if (decodedUrl.startsWith('web+memorygarden://')) {
            const path = decodedUrl.replace('web+memorygarden://', '')
            onProtocolAction({ type: 'unknown', protocol: path })
          }
        }
      } else if (url.pathname === '/plant') {
        const data = searchParams.get('data')
        onProtocolAction({ 
          type: 'plant-memory', 
          data: data ? decodeURIComponent(data) : undefined 
        })
        window.history.replaceState({}, '', '/')
      } else if (url.pathname === '/memory') {
        const id = searchParams.get('id')
        if (id) {
          onProtocolAction({ 
            type: 'view-memory', 
            id: decodeURIComponent(id) 
          })
          window.history.replaceState({}, '', '/')
        }
      }
    }

    handleProtocol()
  }, [onProtocolAction])
}
