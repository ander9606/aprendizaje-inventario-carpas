import { useNavigate } from "react-router-dom";

export function useNavigation() {
    const navigate = useNavigate()

    const volverAModulos = () => {
        navigate(`/`)
    }

    const volverAAlquileres = () => {
        navigate(`/alquileres`)
    }

    return { volverAModulos, volverAAlquileres }
}