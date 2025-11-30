// ================================
// HOOK DE MATERIALES
// ================================

import { useState, useEffect } from "react";
import materialesAPI from "../api/apiMateriales";

// ----------------------------------
// OBTENER TODOS LOS MATERIALES
// ----------------------------------
export function useGetMateriales() {
    const [materiales, setMateriales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        materialesAPI.get("/materiales")
            .then(res => {
                setMateriales(res.data.data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.response?.data?.message || "Error al cargar materiales");
                setLoading(false);
            });
    }, []);

    return { materiales, loading, error };
}

// ----------------------------------
// OBTENER MATERIAL POR ID
// ----------------------------------
export function useGetMaterialById(id) {
    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        materialesAPI.get(`/materiales/${id}`)
            .then(res => {
                setMaterial(res.data.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    return { material, loading };
}

// ----------------------------------
// CREAR MATERIAL
// ----------------------------------
export function useCreateMaterial() {
    const [loading, setLoading] = useState(false);

    const createMaterial = async (data) => {
        setLoading(true);
        try {
            const res = await materialesAPI.post("/materiales", data);
            setLoading(false);
            return res.data;
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    return { createMaterial, loading };
}

// ----------------------------------
// ACTUALIZAR MATERIAL
// ----------------------------------
export function useUpdateMaterial() {
    const [loading, setLoading] = useState(false);

    const updateMaterial = async (id, data) => {
        setLoading(true);
        try {
            const res = await materialesAPI.put(`/materiales/${id}`, data);
            setLoading(false);
            return res.data;
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    return { updateMaterial, loading };
}

// ----------------------------------
// ELIMINAR MATERIAL
// ----------------------------------
export function useDeleteMaterial() {
    const [loading, setLoading] = useState(false);

    const deleteMaterial = async (id) => {
        setLoading(true);
        try {
            const res = await materialesAPI.delete(`/materiales/${id}`);
            setLoading(false);
            return res.data;
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    return { deleteMaterial, loading };
}
