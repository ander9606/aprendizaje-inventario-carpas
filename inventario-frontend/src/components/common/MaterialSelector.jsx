import React from "react";
import { useGetMateriales } from "../hooks/useMateriales";

const MaterialSelector = ({ value, onChange, label = "Material" }) => {
    const { materiales, loading } = useGetMateriales();

    return (
        <div className="campo-formulario">
            <label>{label}</label>

            <select value={value} onChange={onChange}>
                <option value="">Seleccione un material</option>

                {loading && <option>Cargando...</option>}

                {!loading && materiales.length === 0 && (
                    <option>No hay materiales</option>
                )}

                {!loading &&
                    materiales.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.nombre}
                        </option>
                    ))}
            </select>
        </div>
    );
};

export default MaterialSelector;
