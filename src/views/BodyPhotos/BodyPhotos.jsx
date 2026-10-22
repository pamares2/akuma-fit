import { useState } from 'react';
import BodyPhotoCapture from '../../components/complex/BodyPhotoCapture/BodyPhotoCapture.jsx';
import PhotoComparator from '../../components/complex/PhotoComparator/PhotoComparator.jsx';
import Spinner from '../../components/primitives/Spinner/Spinner.jsx';
import { photoService } from '../../services/photoService.js';
import { getCurrentProfile } from '../../utils/auth.js';


/**
 * Convierte un data URL (base64) en un objeto File.
 *
 * @param {string} dataurl - Data URL de la imagen.
 * @param {string} filename - Nombre del archivo resultante.
 * @returns {File} Archivo.
 */
function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

/**
 * Vista de captura y guardado de las fotos corporales del cliente.
 *
 * @param {Object} props - Props del componente.
 * @param {() => void} [props.onBack] - Callback para volver atrás.
 */
function BodyPhotos({ onBack }) {
    const [photos, setPhotos] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    const handlePhotosChange = (newPhotos) => {
        setPhotos(newPhotos);
        setSaved(false);
        setError(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const profile = await getCurrentProfile();
            const today = new Date().toISOString().split('T')[0];

            for (const [position, dataUrl] of Object.entries(photos)) {
                const file = dataURLtoFile(dataUrl, `${position}.jpg`);
                await photoService.upload(profile.id, today, position, file);
            }

            setSaved(true);
            setPhotos({});
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="body-photos">
            <div className="body-photos-header">
                <h1 className="body-photos-title">Fotos Corporales</h1>
                <p className="body-photos-description">
                    Registra tu progreso visual con fotos desde diferentes ángulos.
                </p>
            </div>

            <BodyPhotoCapture onPhotosChange={handlePhotosChange} />

            <PhotoComparator clientName="Tu Progreso" />

            <div className="body-photos-actions">
                {saving && <Spinner text="Guardando fotos..." />}
                {saved && (
                    <div className="success-message">
                        ¡Fotos guardadas correctamente!
                    </div>
                )}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                
                <div className="body-photos-buttons">
                    {onBack && (
                        <button onClick={onBack} className="back-button" disabled={saving}>
                            <span className="button-text">Volver</span>
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={Object.keys(photos).length === 0 || saving}
                        className="save-photos-button"
                    >
                        <span className="button-text">{saving ? 'Guardando...' : 'Guardar Fotos'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BodyPhotos;
