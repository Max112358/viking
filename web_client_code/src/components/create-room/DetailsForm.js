// components/create-room/DetailsForm.js
import React from 'react';

const DetailsForm = ({ theme, formData, urlCheckState, isLoading, onFieldChange, onImageChange }) => {
  const getUrlFeedbackClass = () => {
    if (!urlCheckState.showFeedback || urlCheckState.isChecking) {
      return 'text-muted';
    }
    if (urlCheckState.isAvailable === null) {
      return 'text-muted';
    }
    return urlCheckState.isAvailable ? 'text-success' : 'text-danger';
  };

  const getUrlFeedbackMessage = () => {
    if (!formData.urlName) {
      return '';
    }
    if (urlCheckState.isChecking) {
      return 'Checking availability...';
    }
    return urlCheckState.message || '';
  };

  const getInputValidationClass = () => {
    if (!formData.urlName || !urlCheckState.showFeedback || urlCheckState.isChecking) {
      return '';
    }
    if (formData.urlName.length < 3) {
      return '';
    }
    return urlCheckState.isAvailable ? 'is-valid' : 'is-invalid';
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onImageChange(file, url);
    }
  };

  return (
    <>
      <div className="mb-3">
        <label htmlFor="roomName" className="form-label">
          Room Name
        </label>
        <input
          type="text"
          className="form-control"
          id="roomName"
          value={formData.roomName}
          onChange={(e) => onFieldChange('roomName', e.target.value)}
          required
          maxLength={50}
          placeholder="My Awesome Room"
        />
      </div>

      <div className="mb-3">
        <label htmlFor="urlName" className="form-label">
          Room URL
        </label>
        <div className="input-group">
          <span className="input-group-text">v/</span>
          <input
            type="text"
            className={`form-control ${getInputValidationClass()}`}
            id="urlName"
            value={formData.urlName}
            onChange={(e) => onFieldChange('urlName', e.target.value.toLowerCase())}
            required
            maxLength={50}
            placeholder="my-awesome-room"
            disabled={isLoading}
          />
          {urlCheckState.isChecking && (
            <div className="spinner-border spinner-border-sm ms-2" role="status">
              <span className="visually-hidden">Checking...</span>
            </div>
          )}
        </div>
        {formData.urlName && <div className={`form-text ${getUrlFeedbackClass()}`}>{getUrlFeedbackMessage()}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          className="form-control"
          id="description"
          value={formData.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          rows="3"
          required
          maxLength={500}
          placeholder="Tell people what this room is about..."
        />
      </div>

      <div className="mb-3">
        <label htmlFor="thumbnail" className="form-label">
          Room Thumbnail
        </label>
        <input type="file" className="form-control" id="thumbnail" accept="image/*" onChange={handleImageChange} />
        {formData.previewUrl && (
          <div className="mt-2 d-flex justify-content-center">
            <div
              className={`d-flex align-items-center justify-content-center rounded-circle overflow-hidden ${
                theme === 'dark' ? 'bg-dark' : 'bg-white'
              }`}
              style={{
                width: '100px',
                height: '100px',
                position: 'relative',
              }}
            >
              <img
                src={formData.previewUrl}
                alt="Thumbnail preview"
                className="w-100 h-100 object-fit-cover"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DetailsForm;
