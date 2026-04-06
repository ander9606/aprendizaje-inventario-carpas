import React from "react";
import { useGetMateriales } from "../hooks/useMateriales";
import { useTranslation } from 'react-i18next';

const MaterialSelector = ({ value, onChange, label }) => {
    const { materiales, loading } = useGetMateriales();
    const { t } = useTranslation();
    const resolvedLabel = label || t('materialSelector.label');

    return (
        <div className="campo-formulario">
            <label>{resolvedLabel}</label>

            <select value={value} onChange={onChange}>
                <option value="">{t('materialSelector.placeholder')}</option>

                {loading && <option>{t('materialSelector.loading')}</option>}

                {!loading && materiales.length === 0 && (
                    <option>{t('materialSelector.noMaterials')}</option>
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
