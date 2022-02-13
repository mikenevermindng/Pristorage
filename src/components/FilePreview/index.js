import React from 'react';
import './index.css'

const FilePreview = ({url}) => {

    return (
        <>
        <iframe 
            src={url} 
            frameBorder="0" 
            className="frame"
            allowFullScreen
        />
        </>
    )
}

export default FilePreview