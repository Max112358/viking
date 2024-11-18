// components/create-room/SettingsForm.js
import React from 'react';

const SettingsForm = ({ theme, settings, onSettingChange }) => {
  const getThreadLimitDisplay = (value) => (value === 500 ? '∞' : value);
  const getPostsPerThreadDisplay = (value) => (value === 1000 ? '∞' : value);

  return (
    <div className={`card mb-3 ${theme === 'dark' ? 'bg-secondary' : ''}`}>
      <div className={`card-header ${theme === 'dark' ? 'bg-high-dark text-light border-secondary' : ''}`}>
        <h5 className="mb-0">Room Settings</h5>
      </div>
      <div className={`card-body ${theme === 'dark' ? 'bg-high-dark text-light' : ''}`}>
        {/* Visibility Settings */}
        <div className="mb-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="isPublic"
              checked={settings.isPublic}
              onChange={(e) => onSettingChange('isPublic', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="isPublic">
              Public Room
              <small className="d-block text-secondary">Room will be visible to everyone</small>
            </label>
          </div>
        </div>

        {/* Content Rating Setting */}
        <div className="mb-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="isNsfw"
              checked={settings.isNsfw}
              onChange={(e) => onSettingChange('isNsfw', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="isNsfw">
              NSFW Content
              <small className="d-block text-secondary">Mark room as containing adult/mature content</small>
            </label>
          </div>
        </div>

        {/* Posting Permissions */}
        <div className="mb-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="allowUserThreads"
              checked={settings.allowUserThreads}
              onChange={(e) => onSettingChange('allowUserThreads', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="allowUserThreads">
              Allow Users to Create Threads
              <small className="d-block text-secondary">Users can start new discussions</small>
            </label>
          </div>
        </div>

        {/* Anonymous Posting Settings */}
        <div className="mb-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="allowAnonymous"
              checked={settings.allowAnonymous}
              onChange={(e) => onSettingChange('allowAnonymous', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="allowAnonymous">
              Allow Anonymous Posts
              <small className="d-block text-secondary">Users can post without showing their username</small>
            </label>
          </div>
        </div>

        {settings.allowAnonymous && (
          <>
            <div className="mb-3 ms-4">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="anonymousUniquePerThread"
                  checked={settings.anonymousUniquePerThread}
                  onChange={(e) => onSettingChange('anonymousUniquePerThread', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="anonymousUniquePerThread">
                  Unique Anonymous IDs Per Thread
                  <small className="d-block text-secondary">Each anonymous user gets a different random ID in each thread</small>
                </label>
              </div>
            </div>

            <div className="mb-3 ms-4">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="allowAccountless"
                  checked={settings.allowAccountless}
                  onChange={(e) => onSettingChange('allowAccountless', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="allowAccountless">
                  Allow Accountless Posting
                  <small className="d-block text-secondary">Allow users to post without an account using their IP address</small>
                </label>
              </div>
            </div>
          </>
        )}

        {/* Location Features */}
        <div className="mb-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="showCountryFlags"
              checked={settings.showCountryFlags}
              onChange={(e) => onSettingChange('showCountryFlags', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="showCountryFlags">
              Show Country Flags
              <small className="d-block text-secondary">Display country flag based on poster's IP address</small>
            </label>
          </div>
        </div>

        {/* Thread Limits */}
        <div className="mb-3">
          <label htmlFor="threadLimit" className="form-label d-flex justify-content-between">
            Thread Limit
            <span className={theme === 'dark' ? 'text-light' : 'text-muted'}>{getThreadLimitDisplay(settings.threadLimit)}</span>
          </label>
          <div className="d-flex align-items-center gap-2">
            <span className="small">10</span>
            <input
              type="range"
              className="form-range flex-grow-1"
              id="threadLimit"
              min="10"
              max="500"
              step="10"
              value={settings.threadLimit}
              onChange={(e) => onSettingChange('threadLimit', parseInt(e.target.value))}
            />
            <span className="small">∞</span>
          </div>
          <small className="text-secondary">Maximum number of threads allowed in the room</small>
        </div>

        {/* Posts Per Thread Limit */}
        <div className="mb-3">
          <label htmlFor="postsPerThread" className="form-label d-flex justify-content-between">
            Posts Per Thread Limit
            <span className={theme === 'dark' ? 'text-light' : 'text-muted'}>{getPostsPerThreadDisplay(settings.postsPerThread)}</span>
          </label>
          <div className="d-flex align-items-center gap-2">
            <span className="small">100</span>
            <input
              type="range"
              className="form-range flex-grow-1"
              id="postsPerThread"
              min="100"
              max="1000"
              step="100"
              value={settings.postsPerThread}
              onChange={(e) => onSettingChange('postsPerThread', parseInt(e.target.value))}
            />
            <span className="small">∞</span>
          </div>
          <small className="text-secondary">Maximum number of posts allowed in each thread</small>
        </div>
      </div>
    </div>
  );
};

export default SettingsForm;
