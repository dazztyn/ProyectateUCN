import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface AuthCareerData {
    loading: boolean;
    access_token: string | null;
    indiceCarrera: number | null;
    carreraActual: string;
}


type LocationState = { 
    indice: number; 
    access_token: string; 
} | undefined;


const fetchUserData = async (token: string, i: number): Promise<string> => {
    try {
        const res = await axios.post(
            "http://localhost:3000/alumno",
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data.carreras?.[i]?.nombre || "Ninguna seleccionada";
    } catch (err) {
        console.error("Error fetching user data:", err);
        throw new Error("Error al obtener la información de la carrera.");
    }
};


export const useAuthAndCareer = (): AuthCareerData => {
    const location = useLocation();
    const navigate = useNavigate();
    const storage = localStorage; 

    const [access_token, setaccess_token] = useState<string | null>(null);
    const [indiceCarrera, setIndiceCarrera] = useState<number | null>(null);
    const [carreraActual, setCarreraActual] = useState<string>("Cargando...");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const state = location.state as LocationState;
        
        let token: string | null = null;
        let indice: number | null = null;

        if (state?.access_token) {
            token = state.access_token;
            indice = state.indice;
        } else {
            token = storage.getItem("access_token");
            const storedIndex = storage.getItem("indiceCarrera");
            indice = storedIndex ? Number(storedIndex) : null;
        }
        
        if (token && indice !== null) {
            setaccess_token(token);
            setIndiceCarrera(indice);

            fetchUserData(token, indice)
                .then(nombreCarrera => setCarreraActual(nombreCarrera))
                .catch(() => {
                    navigate("/seleccion");
                })
                .finally(() => {
                    setLoading(false);
                });
            
        } else {
            navigate("/seleccion");
        }

    }, [location.state, navigate, storage]);
    
    return { loading, access_token, indiceCarrera, carreraActual };
};