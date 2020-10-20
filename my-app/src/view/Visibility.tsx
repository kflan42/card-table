import React from 'react'


export function usePageVisibility() {
    const [isVisible, setIsVisible] = React.useState(!document.hidden)
    const onVisibilityChange = () => setIsVisible(!document.hidden)
    React.useEffect(() => {
        document.addEventListener("visibilitychange", onVisibilityChange, false)
        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange)
        }
    })
    return isVisible
}