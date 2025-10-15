import React from "react"; 
import {useState} from "react"; 
import { useNavigate } from 'react-router-dom'; 
import '../style/styleLogin.css'; 
type Carrera = {
     nombre: string; 
     codigo: string; 
     catalogo: string; }; 
     const SeleccionCarrera: React.FC = () => { 
        const navigate = useNavigate(); 
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}'); 
        const access_token = localStorage.getItem('access_token'); 
        const [open, setOpen] = useState(false); 
        const [selected, setSelected] = useState<Carrera | null>(null); 
        const carreras: Carrera[] = usuario?.carreras || []; 
        const handleSelect = (index: number) => { 
            localStorage.setItem('indiceCarrera', index.toString());
            setSelected(carreras[index]); navigate('/malla', { state: { indice: index, access_token } }); }; 
            return ( <div> <h1>Selecciona tu carrera</h1> 
            <div onClick={() => setOpen(!open)} 
            className="bloque-carrera"> {selected ? selected.nombre : "Haz click para elegir una carrera"} 
            </div> 
            {open && ( <ul className="lista-carreras"> 
                {carreras.map((c, i) => ( <li key={c.codigo} onClick={() => handleSelect(i)}> 
                    {c.nombre} 
                    </li> 
                ))} 
                    </ul> 
                )} 
                    </div> 
                    ); }; 
                    
export default SeleccionCarrera;