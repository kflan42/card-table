import { useHistory } from 'react-router-dom'

export function useRouteChanger() {

    const history = useHistory()

    const routeChange = (r: string) => {
        history.push(r) // navigate first so on disconnect logic doesn't trigger reload
    }

    return routeChange
}